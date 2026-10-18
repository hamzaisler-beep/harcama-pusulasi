"""
Uçtan uca test: sahte Firebase'li derlemeyi (dist-e2e) gerçek tarayıcıda gezer.

Çalıştırma:  npm run build:e2e && python3 e2e/run.py
Ekran görüntüleri: e2e/shots/
"""
import asyncio
import http.server
import json
import os
import socketserver
import sys
import threading

from playwright.async_api import async_playwright, expect

ROOT = os.path.join(os.path.dirname(__file__), "..", "dist-e2e")
SHOTS = os.path.join(os.path.dirname(__file__), "shots")
PORT = 8799
BASE = f"http://localhost:{PORT}"


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    """Bilinmeyen adresleri index.html'e yönlendirir (Vercel'deki rewrite gibi)."""

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, *a):
        pass

    def send_head(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path) and not os.path.exists(os.path.join(path, "index.html")):
            self.path = "/index.html"
        return super().send_head()


def serve():
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("", PORT), SPAHandler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


passed = []


def ok(msg):
    passed.append(msg)
    print("  ✓", msg)


async def shot(page, name):
    os.makedirs(SHOTS, exist_ok=True)
    await page.screenshot(path=os.path.join(SHOTS, f"{name}.png"))


async def field(page, label):
    return page.get_by_label(label, exact=True)


async def button(page, name):
    return page.get_by_role("button", name=name, exact=True)


async def signup(page, name, email, password):
    await page.goto(BASE + "/")
    await page.get_by_role("tab", name="Hesap oluştur").click()
    await (await field(page, "Adın")).fill(name)
    await (await field(page, "E-posta")).fill(email)
    await (await field(page, "Şifre")).fill(password)
    await (await button(page, "Hesap oluştur")).click()


async def signin(page, email, password):
    await page.goto(BASE + "/")
    await (await field(page, "E-posta")).fill(email)
    await (await field(page, "Şifre")).fill(password)
    await (await button(page, "Giriş yap")).click()


async def signout(page):
    await page.goto(BASE + "/ayarlar")
    await (await button(page, "Çıkış yap")).click()
    await expect(page.get_by_role("tab", name="Giriş yap")).to_be_visible(timeout=8000)


async def add_tx(page, amount, category, *, income=False, note=None, other_date=None):
    await page.goto(BASE + "/ekle")
    await expect(page.get_by_text("Yeni işlem", exact=True)).to_be_visible(timeout=8000)
    if income:
        await page.get_by_role("tab", name="Gelir").click()
    await page.get_by_test_id("amount-input").fill(amount)
    await page.get_by_role("button", name=f"Kategori: {category}").click()
    if other_date:
        await (await button(page, "Başka gün")).click()
        await (await field(page, "Tarih (GG.AA.YYYY)")).fill(other_date)
    if note:
        await (await field(page, "Not (isteğe bağlı)")).fill(note)
    await page.get_by_test_id("save-transaction").click()
    # Kayıt sunucuya ulaşınca Ana Sayfa'ya döner
    await page.wait_for_url(BASE + "/", timeout=8000)
    await expect(page.get_by_test_id("balance-amount")).to_be_visible(timeout=8000)


async def household_from_storage(page):
    raw = await page.evaluate("localStorage.getItem('__fbmock_db')")
    data = json.loads(raw)
    homes = {k: v for k, v in data.items() if k.startswith("households/") and k.count("/") == 1}
    return homes


async def main():
    httpd = serve()
    errors = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        page = await ctx.new_page()
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        page.on(
            "console",
            lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type in ("error",) else None,
        )
        page.on("dialog", lambda d: asyncio.ensure_future(d.accept()))

        print("1) Kayıt ve hata mesajları")
        await page.goto(BASE + "/")
        await (await button(page, "Giriş yap")).click()
        await expect(page.get_by_text("E-posta adresi geçersiz.")).to_be_visible()
        ok("boş form Türkçe hata gösteriyor")
        await page.get_by_role("tab", name="Hesap oluştur").click()
        await (await field(page, "Adın")).fill("Hamza")
        await (await field(page, "E-posta")).fill("hamza@test.com")
        await (await field(page, "Şifre")).fill("123")
        await (await button(page, "Hesap oluştur")).click()
        await expect(page.get_by_text("Şifre en az 6 karakter olmalı.")).to_be_visible()
        ok("kısa şifre uyarısı")
        await (await field(page, "Şifre")).fill("gizli123")
        await (await button(page, "Hesap oluştur")).click()
        await expect(page.get_by_text("Hanen hazır mı?")).to_be_visible(timeout=8000)
        ok("kayıttan sonra hane ekranı geldi")
        await shot(page, "01-hane")

        print("2) Hane kurma (sunucu gecikmeli)")
        await (await field(page, "Hane adı")).fill("İşler Evi")
        await (await button(page, "Haneyi kur")).click()
        await expect(page.get_by_test_id("balance-amount")).to_be_visible(timeout=8000)
        await expect(page.get_by_text("İşler Evi")).to_be_visible()
        ok("hane kuruldu, Ana Sayfa'ya geçti (eski yarış hatası yok)")
        await expect(page.get_by_text("Eşini davet et")).to_be_visible()
        ok("davet kartı görünüyor")
        homes = await household_from_storage(page)
        assert len(homes) == 1, homes
        code = list(homes.values())[0]["inviteCode"]
        assert len(code) == 6
        ok(f"davet kodu oluştu: {code}")
        await shot(page, "02-ana-sayfa-bos")

        print("3) İşlem ekleme")
        await page.goto(BASE + "/ekle")
        await page.get_by_test_id("amount-input").fill("")
        await page.get_by_test_id("save-transaction").click()
        await expect(page.get_by_text("Tutarı anlayamadım", exact=False)).to_be_visible()
        ok("boş tutar engellendi")
        await (await button(page, "Başka gün")).click()
        await page.get_by_test_id("amount-input").fill("100")
        await (await field(page, "Tarih (GG.AA.YYYY)")).fill("31.02.2026")
        await page.get_by_test_id("save-transaction").click()
        await expect(page.get_by_text("Tarihi GG.AA.YYYY", exact=False)).to_be_visible()
        ok("geçersiz tarih engellendi")

        await add_tx(page, "1.250,50", "Market", note="Migros haftalık")
        await expect(page.get_by_test_id("expense-amount")).to_have_text("1.250,50 ₺")
        ok("gider eklendi, Ana Sayfa gideri 1.250,50 ₺")
        await add_tx(page, "58000", "Maaş", income=True)
        await expect(page.get_by_test_id("income-amount")).to_have_text("58.000 ₺")
        await expect(page.get_by_test_id("balance-amount")).to_have_text("56.749,50 ₺")
        ok("gelir eklendi, kalan doğru: 56.749,50 ₺")
        await add_tx(page, "400", "Ulaşım")
        await expect(page.get_by_test_id("expense-amount")).to_have_text("1.650,50 ₺")
        ok("ikinci gider toplamı doğru: 1.650,50 ₺")
        await expect(page.get_by_text("Migros haftalık", exact=False)).to_be_visible()
        ok("son işlemlerde not görünüyor")
        await shot(page, "03-ana-sayfa-dolu")

        print("4) Geçmiş ay")
        await add_tx(page, "300", "Faturalar", other_date="15.01.2026")
        await expect(page.get_by_test_id("expense-amount")).to_have_text("1.650,50 ₺")
        ok("başka aya eklenen işlem bu ayın toplamını değiştirmedi")

        print("5) Liste, arama, düzenleme, silme")
        await page.goto(BASE + "/islemler")
        await expect(page.get_by_test_id("screen-islemler").get_by_text("Bugün", exact=True)).to_be_visible(timeout=8000)
        await expect(page.get_by_test_id("screen-islemler").get_by_text("Market", exact=True)).to_be_visible()
        await (await field(page, "Ara")).fill("migros")
        await expect(page.get_by_test_id("screen-islemler").get_by_text("Ulaşım", exact=True)).to_have_count(0)
        await expect(page.get_by_test_id("screen-islemler").get_by_text("Market", exact=True)).to_be_visible()
        ok("arama (not içinde, büyük/küçük harf duyarsız) çalışıyor")
        await shot(page, "04-islemler")
        await page.get_by_test_id("screen-islemler").get_by_role("button", name="Market", exact=False).first.click()
        await expect(page.get_by_text("İşlemi düzenle")).to_be_visible(timeout=8000)
        await expect(page.get_by_test_id("amount-input")).to_have_value("1250,50")
        ok("düzenleme ekranı mevcut değerlerle açıldı")
        await shot(page, "05-duzenle")
        await page.get_by_test_id("amount-input").fill("1000")
        await page.get_by_test_id("save-transaction").click()
        await expect(page.get_by_text("İşlemi düzenle")).to_have_count(0, timeout=8000)
        await page.goto(BASE + "/")
        await expect(page.get_by_test_id("expense-amount")).to_have_text("1.400 ₺", timeout=8000)
        ok("düzenleme kaydedildi, toplam güncellendi: 1.400 ₺")

        await page.goto(BASE + "/islemler")
        await page.get_by_test_id("screen-islemler").get_by_role("button", name="Ulaşım", exact=False).first.click()
        await expect(page.get_by_text("İşlemi düzenle")).to_be_visible(timeout=8000)
        await page.get_by_test_id("delete-transaction").click()
        await expect(page.get_by_text("İşlemi düzenle")).to_have_count(0, timeout=8000)
        await page.goto(BASE + "/")
        await expect(page.get_by_test_id("expense-amount")).to_have_text("1.000 ₺", timeout=8000)
        ok("silme çalıştı, toplam 1.000 ₺")

        print("6) Önceki ay gezinme")
        await page.goto(BASE + "/islemler")
        for _ in range(9):
            await page.get_by_test_id("screen-islemler").get_by_role("button", name="Önceki ay").click()
        await expect(page.get_by_test_id("screen-islemler").get_by_text("Ocak 2026")).to_be_visible()
        await expect(page.get_by_test_id("screen-islemler").get_by_text("Faturalar", exact=True)).to_be_visible()
        ok("Ocak 2026'da geçmiş işlem görünüyor")

        print("7) Yenileme sonrası kalıcılık")
        await page.reload()
        await page.goto(BASE + "/")
        await expect(page.get_by_test_id("income-amount")).to_have_text("58.000 ₺", timeout=8000)
        ok("sayfa yenilenince veriler duruyor")

        print("8) Eşin katılması")
        await signout(page)
        await signup(page, "Ayşe", "ayse@test.com", "gizli456")
        await expect(page.get_by_text("Hanen hazır mı?")).to_be_visible(timeout=8000)
        await (await field(page, "Davet kodu")).fill("XXXXXX")
        await (await button(page, "Katıl")).click()
        await expect(page.get_by_text("Bu davet kodu bulunamadı", exact=False)).to_be_visible(timeout=8000)
        ok("yanlış kod reddedildi")
        await (await field(page, "Davet kodu")).fill(code.lower())
        await (await button(page, "Katıl")).click()
        await expect(page.get_by_text("İşler Evi")).to_be_visible(timeout=8000)
        await expect(page.get_by_test_id("income-amount")).to_have_text("58.000 ₺")
        ok("eş katıldı ve aynı verileri görüyor")
        await expect(page.get_by_role("button", name="Hamza", exact=True)).to_be_visible()
        ok("kişi filtresi göründü (Hepsi / Ben / Hamza)")
        await add_tx(page, "250", "Yemek", note="Kahve")
        await expect(page.get_by_test_id("expense-amount")).to_have_text("1.250 ₺")
        await (await button(page, "Ben")).click()
        await expect(page.get_by_test_id("expense-amount")).to_have_text("250 ₺")
        await expect(page.get_by_test_id("income-amount")).to_have_text("0 ₺")
        ok("'Ben' filtresi sadece eşin işlemlerini sayıyor")
        await shot(page, "06-es-ana-sayfa")

        print("9) Hamza eşin işlemini görüyor")
        await signout(page)
        await signin(page, "hamza@test.com", "gizli123")
        await expect(page.get_by_test_id("expense-amount")).to_have_text("1.250 ₺", timeout=8000)
        await expect(page.get_by_text("Kahve", exact=False)).to_be_visible()
        ok("Hamza, eşinin eklediği harcamayı görüyor")
        await page.goto(BASE + "/ayarlar")
        await expect(page.get_by_text("Ayşe", exact=True)).to_be_visible()
        ok("Ayarlar'da iki üye listeleniyor")
        await shot(page, "07-ayarlar")

        print("10) Hane adı değiştirme")
        await page.get_by_role("button", name="Hane adını değiştir").click()
        await (await field(page, "Yeni hane adı")).fill("   ")
        await (await button(page, "Kaydet")).click()
        await expect(page.get_by_text("Hane adı boş olamaz.")).to_be_visible()
        ok("boş hane adı engellendi")
        await (await field(page, "Yeni hane adı")).fill("Bizim Ev")
        await (await button(page, "Kaydet")).click()
        await expect(page.get_by_text("Bizim Ev", exact=True)).to_be_visible(timeout=8000)
        await page.goto(BASE + "/")
        await expect(page.get_by_text("Bizim Ev", exact=True)).to_be_visible(timeout=8000)
        ok("hane adı değişti, Ana Sayfa'da da güncel")

        print("11) Yenilemede adres korunuyor")
        await page.goto(BASE + "/islemler")
        await expect(page.get_by_label("Ara", exact=True)).to_be_visible(timeout=8000)
        ok("/islemler yenilenince aynı sayfada kaldı")

        # Bu noktada bu ay: Market 1.000 ₺ (Hamza), Yemek 250 ₺ (Ayşe), Maaş 58.000 ₺
        print("12) Bütçe limitleri")
        await page.goto(BASE + "/butce")
        b = page.get_by_test_id("screen-butce")
        await expect(b.get_by_text("Henüz limit koymadın")).to_be_visible(timeout=8000)
        ok("limit yokken boş durum gösteriliyor")
        await b.get_by_role("button", name="Limit koy").click()
        await expect(page.get_by_text("Aylık limitler")).to_be_visible(timeout=8000)
        await page.get_by_label("Market limiti", exact=True).fill("1.200")
        await page.get_by_label("Yemek limiti", exact=True).fill("200")
        await page.get_by_label("Kira limiti", exact=True).fill("15000")
        await expect(page.get_by_text("16.400 ₺", exact=True)).to_be_visible()
        ok("toplam limit canlı hesaplanıyor: 16.400 ₺")
        await shot(page, "08-limitler")
        await page.get_by_test_id("save-budget").click()
        await expect(b.get_by_test_id("budget-total")).to_be_visible(timeout=8000)
        await expect(b.get_by_text("50 ₺ aşıldı")).to_be_visible()
        ok("Yemek: 250/200 → '50 ₺ aşıldı'")
        await expect(b.get_by_text("%83 · 200 ₺ kaldı")).to_be_visible()
        ok("Market: 1.000/1.200 → '%83 · 200 ₺ kaldı' (uyarı)")
        await expect(b.get_by_text("%0 · 15.000 ₺ kaldı")).to_be_visible()
        ok("Kira: harcama yok → '%0'")
        await expect(b.get_by_test_id("budget-total")).to_contain_text("1.250 ₺")
        ok("toplam bütçe harcaması 1.250 ₺ / 16.400 ₺")
        await shot(page, "09-butce")

        await page.goto(BASE + "/")
        a = page.get_by_test_id("screen-ana")
        await expect(a.get_by_text("Bütçe uyarısı")).to_be_visible(timeout=8000)
        await expect(a.get_by_text("50 ₺ aşıldı")).to_be_visible()
        ok("Ana Sayfa'da bütçe uyarısı çıkıyor")
        await shot(page, "10-ana-uyari")

        print("13) Limit düzenleme kalıcı")
        await page.goto(BASE + "/butce-duzenle")
        await expect(page.get_by_label("Market limiti", exact=True)).to_have_value("1200", timeout=8000)
        await page.get_by_label("Yemek limiti", exact=True).fill("")
        await page.get_by_test_id("save-budget").click()
        await expect(b.get_by_text("Limitsiz harcamalar")).to_be_visible(timeout=8000)
        ok("limit kaldırılınca Yemek 'Limitsiz harcamalar'a geçti")

        print("14) Raporlar")
        await page.goto(BASE + "/raporlar")
        r = page.get_by_test_id("screen-raporlar")
        await expect(r.get_by_test_id("report-expense")).to_have_text("1.250 ₺", timeout=8000)
        await expect(r.get_by_test_id("report-income")).to_have_text("58.000 ₺")
        ok("bu ay: gider 1.250 ₺, gelir 58.000 ₺")
        await expect(r.get_by_label("Market: 1.000 ₺, yüzde 80")).to_be_visible()
        await expect(r.get_by_label("Yemek: 250 ₺, yüzde 20")).to_be_visible()
        ok("kategori dağılımı doğru (%80 / %20)")
        await expect(r.get_by_label("Hamza: 1.000 ₺, yüzde 80")).to_be_visible()
        await expect(r.get_by_label("Ayşe: 250 ₺, yüzde 20")).to_be_visible()
        ok("kişiye göre dağılım doğru")
        await shot(page, "11-raporlar")
        await r.get_by_role("tab", name="6 ay").click()
        await expect(r.get_by_text("aylık ort.", exact=False)).to_be_visible()
        ok("6 ay görünümü aylık ortalama gösteriyor")

        await browser.close()
    httpd.shutdown()

    real_errors = [e for e in errors if "permission-denied" not in e]
    print()
    print(f"{len(passed)} kontrol geçti.")
    if real_errors:
        print("Tarayıcı hataları:")
        for e in real_errors[:20]:
            print("  -", e)
        sys.exit(1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except AssertionError as e:
        print("BAŞARISIZ:", e)
        sys.exit(1)
