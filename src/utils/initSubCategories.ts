import { Category } from '../services/openai';
import { 
  saveSubCategories, 
  SubCategory, 
  checkSubCategoriesInitialized,
  markSubCategoriesInitialized
} from '../services/firestore';
import { collection, getDocs, writeBatch/*, deleteDoc*/ } from '@firebase/firestore';
import { db } from '../config/firebase';

const predefinedSubCategories: Record<Category, Array<{ name: string, description: string }>> = {
  software: [
    { name: 'Web Geliştirme', description: 'Frontend, backend ve tam yığın web geliştirme' },
    { name: 'Mobil Uygulama', description: 'iOS, Android ve cross-platform uygulama geliştirme' },
    { name: 'Veri Tabanları', description: 'SQL, NoSQL ve veri tabanı yönetimi' },
    { name: 'DevOps', description: 'CI/CD, konteynerizasyon ve bulut altyapısı' },
    { name: 'Yazılım Mimarisi', description: 'Tasarım desenleri ve mimari yaklaşımlar' },
    { name: 'Test ve QA', description: 'Birim testleri, entegrasyon testleri ve kalite güvence' },
    { name: 'Güvenlik', description: 'Uygulama güvenliği ve güvenli kod geliştirme' },
    { name: 'API Geliştirme', description: 'RESTful API ve GraphQL servisleri' },
    { name: 'Performans', description: 'Uygulama optimizasyonu ve performans iyileştirme' },
    { name: 'UI/UX', description: 'Kullanıcı arayüzü ve deneyimi tasarımı' },
    { name: 'Mikroservisler', description: 'Dağıtık sistemler ve mikroservis mimarisi' },
    { name: 'Blockchain', description: 'Akıllı kontratlar ve blockchain uygulamaları' },
    { name: 'Oyun Geliştirme', description: '2D/3D oyun geliştirme ve oyun motorları' },
    { name: 'Yapay Zeka', description: 'Makine öğrenimi ve derin öğrenme uygulamaları' },
    { name: 'IoT', description: 'Nesnelerin interneti ve gömülü sistemler' }
  ],
  technology: [
    { name: 'Yapay Zeka', description: 'Makine öğrenimi, derin öğrenme, robotik sistemler' },
    { name: 'Siber Güvenlik', description: 'Ağ güvenliği, kriptografi, güvenlik protokolleri' },
    { name: 'Veri Bilimi', description: 'Veri analizi, büyük veri, veri madenciliği' },
    { name: 'Bulut Bilişim', description: 'Cloud computing, serverless, mikroservisler' },
    { name: 'Donanım', description: 'Bilgisayar parçaları, elektronik cihazlar, IoT' },
    { name: 'Blockchain', description: 'Kripto paralar, akıllı kontratlar, dağıtık sistemler' },
    { name: 'Mobil Teknolojiler', description: 'Mobil cihazlar, 5G, mobil ağlar' },
    { name: 'Ağ Teknolojileri', description: 'Network protokolleri, internet altyapısı' },
    { name: 'AR/VR', description: 'Artırılmış ve sanal gerçeklik teknolojileri' },
    { name: 'Robotik', description: 'Robot teknolojileri, otomasyon sistemleri' },
    { name: 'Yeşil Teknoloji', description: 'Sürdürülebilir teknolojiler, yenilenebilir enerji' },
    { name: 'Biyoteknoloji', description: 'Genetik mühendislik, biyomedikal teknolojiler' },
    { name: 'Kuantum Bilişim', description: 'Kuantum bilgisayarlar ve kuantum kriptografi' },
    { name: 'Edge Computing', description: 'Uç bilişim ve dağıtık sistemler' },
    { name: 'Giyilebilir Teknoloji', description: 'Akıllı saatler, fitness takipçileri' }
  ],
  science: [
    { name: 'Fizik', description: 'Kuantum fiziği, parçacık fiziği, astrofizik' },
    { name: 'Kimya', description: 'Organik kimya, biyokimya, malzeme bilimi' },
    { name: 'Biyoloji', description: 'Genetik, evrim, ekoloji' },
    { name: 'Astronomi', description: 'Uzay araştırmaları, gökbilim, kozmoloji' },
    { name: 'Matematik', description: 'Cebir, geometri, analiz' },
    { name: 'Çevre Bilimi', description: 'Ekoloji, iklim değişikliği, sürdürülebilirlik' },
    { name: 'Nörobilim', description: 'Beyin araştırmaları, sinir sistemi' },
    { name: 'Jeoloji', description: 'Yer bilimi, mineraller, tektonik' },
    { name: 'Paleontoloji', description: 'Fosiller, dinozorlar, evrim tarihi' },
    { name: 'Oşinografi', description: 'Deniz bilimleri, okyanus araştırmaları' },
    { name: 'Meteoroloji', description: 'Hava durumu, iklim bilimi' },
    { name: 'Botanik', description: 'Bitki biyolojisi, bitki türleri' },
    { name: 'Zooloji', description: 'Hayvan biyolojisi, davranış bilimi' },
    { name: 'Mikrobiyoloji', description: 'Bakteriler, virüsler, mikroorganizmalar' },
    { name: 'Kuantum Bilimi', description: 'Kuantum mekaniği, kuantum hesaplama' }
  ],
  art: [
    { name: 'Resim', description: 'Yağlı boya, suluboya, dijital resim' },
    { name: 'Heykel', description: '3 boyutlu sanat, seramik, modelaj' },
    { name: 'Fotoğrafçılık', description: 'Dijital fotoğrafçılık, kompozisyon' },
    { name: 'Müzik', description: 'Enstrümanlar, beste, müzik teorisi' },
    { name: 'Dans', description: 'Modern dans, klasik bale, koreografi' },
    { name: 'Sinema', description: 'Film yapımı, sinematografi' },
    { name: 'Tiyatro', description: 'Sahne sanatları, dramatik yazım' },
    { name: 'Grafik Tasarım', description: 'Dijital tasarım, tipografi' },
    { name: 'Moda Tasarımı', description: 'Giysi tasarımı, tekstil sanatı' },
    { name: 'Mimari', description: 'Yapı tasarımı, iç mimari' },
    { name: 'El Sanatları', description: 'Geleneksel el işleri, zanaat' },
    { name: 'Edebiyat', description: 'Yazarlık, şiir, roman' },
    { name: 'Animasyon', description: '2D ve 3D animasyon, stop motion' },
    { name: 'Sokak Sanatı', description: 'Grafiti, duvar resimleri' },
    { name: 'Enstalasyon', description: 'Mekan düzenlemeleri, kavramsal sanat' }
  ],
  history: [
    { name: 'Antik Çağ', description: 'Eski uygarlıklar, antik medeniyetler' },
    { name: 'Orta Çağ', description: 'Feodal dönem, karanlık çağ' },
    { name: 'Rönesans', description: 'Yeniden doğuş, sanat ve bilim' },
    { name: 'Sanayi Devrimi', description: 'Endüstrileşme, teknolojik gelişim' },
    { name: 'Modern Tarih', description: '20. ve 21. yüzyıl olayları' },
    { name: 'Askeri Tarih', description: 'Savaşlar, stratejiler, taktikler' },
    { name: 'Kültür Tarihi', description: 'Toplumsal gelişim, gelenekler' },
    { name: 'Bilim Tarihi', description: 'Bilimsel keşifler ve gelişmeler' },
    { name: 'Sanat Tarihi', description: 'Sanatsal akımlar ve dönemler' },
    { name: 'Ekonomi Tarihi', description: 'Ticaret, para sistemleri' },
    { name: 'Din Tarihi', description: 'İnanç sistemleri, dini hareketler' },
    { name: 'Arkeoloji', description: 'Kazılar, antik kalıntılar' },
    { name: 'Siyasi Tarih', description: 'Devletler, politik olaylar' },
    { name: 'Coğrafi Keşifler', description: 'Keşif seferleri, yeni dünya' },
    { name: 'Sosyal Tarih', description: 'Gündelik yaşam, toplumsal değişimler' }
  ],
  philosophy: [
    { name: 'Antik Felsefe', description: 'Sokrates, Platon, Aristoteles dönemi' },
    { name: 'Etik', description: 'Ahlak felsefesi, değerler teorisi' },
    { name: 'Metafizik', description: 'Varlık, gerçeklik, zaman kavramları' },
    { name: 'Epistemoloji', description: 'Bilgi teorisi, bilginin doğası' },
    { name: 'Mantık', description: 'Akıl yürütme, argümantasyon' },
    { name: 'Siyaset Felsefesi', description: 'Devlet teorisi, adalet, özgürlük' },
    { name: 'Varoluşçuluk', description: 'İnsan varoluşu, özgürlük, sorumluluk' },
    { name: 'Din Felsefesi', description: 'Tanrı, inanç, din-felsefe ilişkisi' },
    { name: 'Bilim Felsefesi', description: 'Bilimsel yöntem, bilimin doğası' },
    { name: 'Estetik', description: 'Sanat felsefesi, güzellik kavramı' },
    { name: 'Fenomenoloji', description: 'Bilinç, deneyim, algı' },
    { name: 'Dil Felsefesi', description: 'Anlam teorisi, dil-düşünce ilişkisi' },
    { name: 'Zihin Felsefesi', description: 'Bilinç, yapay zeka, zihin-beden ilişkisi' },
    { name: 'Doğu Felsefesi', description: 'Budizm, Taoizm, Konfüçyanizm' },
    { name: 'Çağdaş Felsefe', description: 'Modern felsefi akımlar ve tartışmalar' }
  ],
  psychology: [
    { name: 'Klinik Psikoloji', description: 'Ruhsal bozukluklar ve tedavi yöntemleri' },
    { name: 'Gelişim Psikolojisi', description: 'İnsan gelişimi ve yaşam dönemleri' },
    { name: 'Sosyal Psikoloji', description: 'İnsan ilişkileri ve grup davranışları' },
    { name: 'Bilişsel Psikoloji', description: 'Düşünme, öğrenme, hafıza süreçleri' },
    { name: 'Nöropsikoloji', description: 'Beyin-davranış ilişkisi' },
    { name: 'Kişilik Psikolojisi', description: 'Karakter özellikleri ve kişilik teorileri' },
    { name: 'Deneysel Psikoloji', description: 'Psikolojik araştırma yöntemleri' },
    { name: 'Evrimsel Psikoloji', description: 'İnsan davranışlarının evrimsel temelleri' },
    { name: 'Pozitif Psikoloji', description: 'İyi oluş ve mutluluk çalışmaları' },
    { name: 'Psikoterapi', description: 'Terapi yaklaşımları ve teknikleri' },
    { name: 'Çocuk Psikolojisi', description: 'Çocuk gelişimi ve davranışları' },
    { name: 'Spor Psikolojisi', description: 'Performans ve motivasyon' },
    { name: 'İş ve Örgüt Psikolojisi', description: 'Çalışma hayatı ve örgütsel davranış' },
    { name: 'Adli Psikoloji', description: 'Suç ve adalet psikolojisi' },
    { name: 'Sağlık Psikolojisi', description: 'Sağlık davranışları ve stres yönetimi' }
  ],
  geography: [
    { name: 'Fiziki Coğrafya', description: 'Yeryüzü şekilleri ve doğal süreçler' },
    { name: 'Beşeri Coğrafya', description: 'İnsan-mekan etkileşimi' },
    { name: 'Klimatoloji', description: 'İklim sistemleri ve değişimleri' },
    { name: 'Kartografya', description: 'Harita yapımı ve coğrafi bilgi sistemleri' },
    { name: 'Jeomorfoloji', description: 'Yeryüzü şekillerinin oluşumu' },
    { name: 'Ekonomik Coğrafya', description: 'Kaynaklar ve ekonomik faaliyetler' },
    { name: 'Kültürel Coğrafya', description: 'Kültürel peyzaj ve toplumsal yapılar' },
    { name: 'Biyocoğrafya', description: 'Canlıların dağılışı ve ekoloji' },
    { name: 'Hidrografya', description: 'Su kaynakları ve okyanus sistemleri' },
    { name: 'Şehir Coğrafyası', description: 'Kentleşme ve şehir planlaması' },
    { name: 'Nüfus Coğrafyası', description: 'İnsan nüfusu ve demografik süreçler' },
    { name: 'Siyasi Coğrafya', description: 'Sınırlar ve jeopolitik' },
    { name: 'Turizm Coğrafyası', description: 'Turizm kaynakları ve destinasyonlar' },
    { name: 'Afet Coğrafyası', description: 'Doğal afetler ve risk yönetimi' },
    { name: 'Çevre Coğrafyası', description: 'Çevre sorunları ve koruma' }
  ],
  photography: [
    { name: 'Portre Fotoğrafçılığı', description: 'İnsan portreleri ve karakterler' },
    { name: 'Manzara Fotoğrafçılığı', description: 'Doğa ve şehir manzaraları' },
    { name: 'Sokak Fotoğrafçılığı', description: 'Kentsel yaşam ve anlık kareler' },
    { name: 'Makro Fotoğrafçılık', description: 'Yakın çekim ve detay fotoğrafları' },
    { name: 'Mimari Fotoğrafçılık', description: 'Yapılar ve mimari detaylar' },
    { name: 'Spor Fotoğrafçılığı', description: 'Hareket ve aksiyon fotoğrafları' },
    { name: 'Belgesel Fotoğrafçılık', description: 'Toplumsal olaylar ve hikayeler' },
    { name: 'Stüdyo Fotoğrafçılığı', description: 'Kontrollü ışık ve kompozisyon' },
    { name: 'Gece Fotoğrafçılığı', description: 'Düşük ışık ve uzun pozlama' },
    { name: 'Doğa Fotoğrafçılığı', description: 'Vahşi yaşam ve doğal ortam' },
    { name: 'Ürün Fotoğrafçılığı', description: 'Ticari ve reklam fotoğrafları' },
    { name: 'Düğün Fotoğrafçılığı', description: 'Özel gün ve etkinlik fotoğrafları' },
    { name: 'Drone Fotoğrafçılığı', description: 'Havadan çekimler ve perspektifler' },
    { name: 'Sualtı Fotoğrafçılığı', description: 'Deniz yaşamı ve sualtı dünyası' },
    { name: 'Deneysel Fotoğrafçılık', description: 'Yaratıcı teknikler ve efektler' }
  ],
  data_science: [
    { name: 'Veri Analizi', description: 'Veri işleme ve analiz teknikleri' },
    { name: 'Makine Öğrenmesi', description: 'Algoritma geliştirme ve model eğitimi' },
    { name: 'Derin Öğrenme', description: 'Yapay sinir ağları ve derin öğrenme modelleri' },
    { name: 'Büyük Veri', description: 'Büyük ölçekli veri yönetimi ve analizi' },
    { name: 'İstatistik', description: 'İstatistiksel analiz ve olasılık' },
    { name: 'Veri Görselleştirme', description: 'Veri sunumu ve görsel anlatım' },
    { name: 'Doğal Dil İşleme', description: 'Metin analizi ve dil modelleri' },
    { name: 'Veri Madenciliği', description: 'Veri keşfi ve örüntü tanıma' },
    { name: 'Tahminsel Analitik', description: 'Öngörü modelleri ve tahminleme' },
    { name: 'Optimizasyon', description: 'Matematiksel optimizasyon ve algoritma' },
    { name: 'Veri Mühendisliği', description: 'Veri altyapısı ve ETL süreçleri' },
    { name: 'Yapay Zeka Etiği', description: 'Etik kurallar ve sorumluluklar' },
    { name: 'Bilgisayarlı Görü', description: 'Görüntü işleme ve nesne tanıma' },
    { name: 'Zaman Serisi Analizi', description: 'Zamansal veri analizi ve tahmin' },
    { name: 'Veri Güvenliği', description: 'Veri koruma ve gizlilik' }
  ],
  business: [
    { name: 'Girişimcilik', description: 'İş kurma ve geliştirme stratejileri' },
    { name: 'Pazarlama', description: 'Pazar analizi ve pazarlama stratejileri' },
    { name: 'Finans', description: 'Finansal yönetim ve yatırım' },
    { name: 'İnsan Kaynakları', description: 'Personel yönetimi ve organizasyon' },
    { name: 'Strateji', description: 'İş stratejisi ve rekabet analizi' },
    { name: 'Operasyon Yönetimi', description: 'Süreç yönetimi ve optimizasyon' },
    { name: 'E-ticaret', description: 'Online ticaret ve dijital pazarlama' },
    { name: 'Proje Yönetimi', description: 'Proje planlama ve uygulama' },
    { name: 'Liderlik', description: 'Yönetim becerileri ve liderlik' },
    { name: 'İnovasyon', description: 'Yenilikçilik ve AR-GE yönetimi' },
    { name: 'Risk Yönetimi', description: 'Risk analizi ve yönetimi' },
    { name: 'Müşteri İlişkileri', description: 'CRM ve müşteri deneyimi' },
    { name: 'Uluslararası Ticaret', description: 'Global ticaret ve pazarlar' },
    { name: 'Sürdürülebilirlik', description: 'Çevresel ve sosyal sorumluluk' },
    { name: 'Dijital Dönüşüm', description: 'Teknoloji entegrasyonu ve değişim yönetimi' }
  ],
  culture: [
    { name: 'Dünya Kültürleri', description: 'Farklı toplumlar ve yaşam tarzları' },
    { name: 'Gelenekler', description: 'Kültürel gelenekler ve ritüeller' },
    { name: 'Dil ve İletişim', description: 'Dil çeşitliliği ve kültürel iletişim' },
    { name: 'Yemek Kültürü', description: 'Mutfak gelenekleri ve gastronomi' },
    { name: 'Popüler Kültür', description: 'Güncel trendler ve medya' },
    { name: 'Mitoloji', description: 'Efsaneler ve kültürel hikayeler' },
    { name: 'Festivaller', description: 'Kültürel kutlamalar ve etkinlikler' },
    { name: 'El Sanatları', description: 'Geleneksel zanaat ve el işleri' },
    { name: 'Giyim ve Moda', description: 'Geleneksel ve modern giyim kültürü' },
    { name: 'Müzik ve Dans', description: 'Kültürel müzik ve dans formları' },
    { name: 'İnanç Sistemleri', description: 'Dini ve manevi gelenekler' },
    { name: 'Sosyal Normlar', description: 'Toplumsal kurallar ve değerler' },
    { name: 'Kültürel Miras', description: 'Tarihi ve kültürel değerler' },
    { name: 'Alt Kültürler', description: 'Alternatif yaşam tarzları ve gruplar' },
    { name: 'Kültürlerarası İletişim', description: 'Kültürler arası etkileşim ve diyalog' }
  ]
};

const deleteSubCategoriesCollection = async () => {
  try {
    console.log('Mevcut alt kategoriler siliniyor...');
    const subcategoriesRef = collection(db, 'subcategories');
    const snapshot = await getDocs(subcategoriesRef);
    
    if (snapshot.empty) {
      console.log('Silinecek alt kategori bulunamadı.');
      return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`${snapshot.size} alt kategori başarıyla silindi.`);
  } catch (error) {
    console.error('Alt kategoriler silinirken hata:', error);
    throw error;
  }
};

export const initializeSubCategories = async () => {
  try {
    console.log('Alt kategori kontrolü yapılıyor...');
    const isInitialized = await checkSubCategoriesInitialized();
    
    if (!isInitialized) {
      console.log('Alt kategoriler yeniden oluşturuluyor...');
      
      // Önce mevcut alt kategorileri sil
      await deleteSubCategoriesCollection();
      
      // Her kategori için önceden tanımlanmış alt kategorileri işle
      for (const [categoryId, subCats] of Object.entries(predefinedSubCategories)) {
        console.log(`${categoryId} için alt kategoriler oluşturuluyor...`);
        
        const formattedSubCategories: SubCategory[] = subCats.map(subCat => ({
          id: crypto.randomUUID(),
          name: subCat.name,
          description: subCat.description,
          parentCategory: categoryId as Category
        }));

        await saveSubCategories(formattedSubCategories);
        console.log(`${categoryId} için ${formattedSubCategories.length} alt kategori oluşturuldu.`);
      }

      await markSubCategoriesInitialized();
      console.log('Tüm alt kategoriler başarıyla oluşturuldu ve işaretlendi!');
    } else {
      console.log('Alt kategoriler zaten oluşturulmuş, işlem atlanıyor.');
    }
  } catch (error) {
    console.error('Alt kategoriler oluşturulurken hata:', error);
    throw error;
  }
}; 