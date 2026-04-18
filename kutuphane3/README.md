# Verileri Firebase'e Aktarma Rehberi

Google E-Tablolar'daki tüm verileriniz (öğrenciler, kitaplar, geçmiş okuma kayıtları, değerlendirmeler vb.) başarıyla çekildi ve proje dizininde **`data_export.json`** adlı bir dosyaya kaydedildi. Hiçbir tarih, özellik veya kayıt kaybolmadı.

Bu dosyayı yeni Firebase veritabanınıza aktarmak için aşağıdaki adımları izleyin:

## Adım 1: Firebase Konsoluna Giriş Yapın
1. [Firebase Console](https://console.firebase.google.com/)'a gidin ve projenizi açın.
2. Sol menüden **"Realtime Database"** bölümüne tıklayın.

## Adım 2: Veritabanına JSON Aktarma
1. Realtime Database sayfasının sağ üst köşesinde, veritabanı kök düğümünüzün hizasında bulunan **üç nokta (⋮)** simgesine (veya doğrudan "Veri İçe Aktar" / "Import JSON" seçeneğine) tıklayın.
2. Açılan menüden **"JSON İçe Aktar" (Import JSON)** seçeneğini seçin.
3. Çıkan dosya yükleme penceresinde, proje klasörünüzde oluşturulan **`data_export.json`** dosyasını seçin.
4. **"İçe Aktar" (Import)** butonuna tıklayın.

*Uyarı: İçe aktarma işlemi mevcut veritabanınızın kökündeki tüm verilerin üzerine yazacaktır. Veritabanınız yeni ve boş olduğu için bu işlem sorun yaratmayacaktır.*

## Adım 3: Firebase Yapılandırmasını Ekleyin
`kutuphane.js` dosyasının en üstünde yer alan `firebaseConfig` değişkenine, Firebase projenizin (Project Settings > General > Your apps altından bulabileceğiniz) API anahtarlarını yapıştırın:

```javascript
const firebaseConfig = {
    apiKey: "SİZİN_API_KEY",
    authDomain: "SİZİN_AUTH_DOMAIN",
    databaseURL: "SİZİN_DATABASE_URL",
    projectId: "SİZİN_PROJECT_ID",
    storageBucket: "SİZİN_STORAGE_BUCKET",
    messagingSenderId: "SİZİN_MESSAGING_SENDER_ID",
    appId: "SİZİN_APP_ID"
};
```

Verilerinizi Firebase'e aktarıp API anahtarlarınızı girdiğinizde sistem kaldığı yerden, hiçbir veri kaybı olmadan hızlı ve senkron bir şekilde çalışmaya devam edecektir.
