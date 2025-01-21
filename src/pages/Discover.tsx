import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { categories, getRandomInfo, Category } from '../services/openai';
import { 
  saveInfo, 
  getUserInfo, 
  getUserCollections, 
  createCollection, 
  UserCollection, 
  getSubCategories,
  getUserSubCategories,
} from '../services/firestore';
import { getFavoriteCategories } from '../services/firestore';
import { toast } from 'react-hot-toast';
import { 
  FiSave, 
  FiStar, 
  FiRefreshCw
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Discover = () => {
  const { currentUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [currentInfo, setCurrentInfo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [favoriteCategories, setFavoriteCategories] = useState<Category[]>([]);
  const [savedInfos, setSavedInfos] = useState<string[]>([]);
  const [userCollections, setUserCollections] = useState<UserCollection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [selectedSubCategories, setSelectedSubCategories] = useState<Record<Category, string[]>>({});
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (currentUser) {
        try {
          const [favorites, infos, collections, userSubCategories] = await Promise.all([
            getFavoriteCategories(currentUser.uid),
            getUserInfo(currentUser.uid),
            getUserCollections(currentUser.uid),
            getUserSubCategories(currentUser.uid)
          ]);

          setFavoriteCategories(favorites);
          setSavedInfos(infos.map(info => info.content));
          setUserCollections(collections);
          setSelectedSubCategories(userSubCategories);

          // Eğer koleksiyon yoksa, "Genel" koleksiyonunu oluştur
          if (collections.length === 0) {
            const generalId = await createCollection(currentUser.uid, 'Genel');
            setUserCollections([{ id: generalId, name: 'Genel', createdAt: new Date(), itemCount: 0 }]);
            setSelectedCollectionId(generalId);
          } else {
            setSelectedCollectionId(collections[0].id);
          }
        } catch (error) {
          console.error('Veriler yüklenirken hata:', error);
        }
      }
    };

    loadData();
  }, [currentUser]);

  const handleCategoryClick = async (categoryId: string, categoryName: string) => {
    console.log('TEST - Kategori seçildi:', categoryName);
    setSelectedCategory(categoryId);
    setSelectedSubCategory(null);
    
    try {
      setLoading(true);
      // Önce alt kategorileri al
      const categorySubCategories = await getSubCategories(categoryId);
      
      // Kullanıcının seçili alt kategorilerini kontrol et
      const userSelectedSubCategories = selectedSubCategories[categoryId] || [];
      
      // Eğer kullanıcı özel seçim yaptıysa onlar arasından, yapmadıysa tüm alt kategorilerden seç
      const availableSubCategories = userSelectedSubCategories.length > 0
        ? categorySubCategories.filter(subCat => userSelectedSubCategories.includes(subCat.id))
        : categorySubCategories;
      
      // Rastgele bir alt kategori seç
      const randomSubCategory = availableSubCategories[Math.floor(Math.random() * availableSubCategories.length)];
      
      // Bilgiyi al
      const info = await getRandomInfo(categoryId, randomSubCategory.name);
      setCurrentInfo(info);
      setSelectedSubCategory(randomSubCategory.name);
      toast.success('Bilgi başarıyla alındı');
    } catch (error) {
      console.error('Bilgi alınırken hata:', error);
      toast.error('Bilgi alınamadı');
      setCurrentInfo('');
      setSelectedSubCategory(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser || !selectedCategory || !currentInfo || !selectedCollectionId) return;

    try {
      await saveInfo(
        currentUser.uid, 
        currentInfo, 
        selectedCategory, 
        selectedCollectionId,
        selectedSubCategory ? selectedSubCategory : undefined
      );
      setSavedInfos([...savedInfos, currentInfo]);
      
      // Koleksiyon listesini güncelle
      setUserCollections(userCollections.map(col => 
        col.id === selectedCollectionId 
          ? { ...col, itemCount: col.itemCount + 1 }
          : col
      ));

      toast.success('Bilgi koleksiyonunuza eklendi');
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      toast.error('Bilgi kaydedilemedi');
    }
  };

  // Kategorileri favori ve diğerleri olarak ayır
  const sortedCategories = [...categories].sort((a, b) => {
    const aIsFavorite = favoriteCategories.includes(a.id);
    const bIsFavorite = favoriteCategories.includes(b.id);
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen pt-16 md:pt-24 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Bilgi Keşfet</h1>
            <p className="text-sm md:text-base text-gray-400">İlgilendiğiniz kategoriden yeni bilgiler öğrenin</p>
          </div>
          <Link to="/collection" className="w-full md:w-auto bg-accent-purple text-white px-4 py-2 rounded-lg hover:bg-accent-purple/90 transition-colors text-center">
            Koleksiyonlarım
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {sortedCategories.map(category => {
            const Icon = category.icon;
            const isFavorite = favoriteCategories.includes(category.id);
            const selectedCount = selectedSubCategories[category.id]?.length || 0;
            const hasSpecificSelection = selectedCount > 0;
            
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id, category.name)}
                className={`relative group overflow-hidden bg-transparent border border-white/20 hover:border-white/40 rounded-lg p-3 md:p-4 transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'border-white text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                disabled={loading}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 transform group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-sm md:text-base text-center">{category.name}</span>
                  <div className="px-2 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple text-xs">
                    {hasSpecificSelection ? `${selectedCount} Alt Kategori` : 'Tümü'}
                  </div>
                </div>
                {isFavorite && (
                  <div className="absolute top-2 right-2">
                    <FiStar className="w-3 h-3 md:w-4 md:h-4 text-accent-purple" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedCategory && (
          <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-4 md:p-6 space-y-4 md:space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-12 h-12 border-t-2 border-white rounded-full animate-spin"></div>
              </div>
            ) : currentInfo ? (
              <>
                <div className="space-y-4">
                  <p className="leading-relaxed text-gray-200 text-sm md:text-base">{currentInfo}</p>
                  {selectedSubCategory && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm text-gray-400">Alt Kategori:</span>
                      <span className="px-2 py-1 bg-accent-purple/20 text-accent-purple rounded-full text-xs md:text-sm">
                        {selectedSubCategory}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={() => handleCategoryClick(selectedCategory, categories.find(c => c.id === selectedCategory)?.name || '')}
                      className="w-full md:w-auto bg-transparent border border-white/20 hover:border-white/40 text-white px-4 md:px-6 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all duration-300 hover:bg-white/5"
                      disabled={loading}
                    >
                      <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      <span className="text-sm md:text-base">Yeni Bilgi</span>
                    </button>
                  </div>

                  {currentUser && (
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full">
                      <select
                        value={selectedCollectionId}
                        onChange={(e) => setSelectedCollectionId(e.target.value)}
                        className="flex-1 bg-zinc-800 border border-white/20 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-white/40 text-sm md:text-base"
                      >
                        {userCollections.map(collection => (
                          <option key={collection.id} value={collection.id}>
                            {collection.name} ({collection.itemCount})
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={handleSave}
                        className="w-full md:w-auto bg-white text-zinc-900 px-4 md:px-6 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all duration-300 hover:bg-gray-100"
                      >
                        <FiSave className="w-4 h-4" />
                        <span className="text-sm md:text-base">Kaydet</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm md:text-base text-gray-400">Bilgi yüklenemedi. Lütfen tekrar deneyin.</p>
            )}
          </div>
        )}

        {!selectedCategory && (
          <div className="text-center py-8 md:py-12 text-gray-400">
            <p className="text-sm md:text-base">Başlamak için bir kategori seçin</p>
            {currentUser && favoriteCategories.length === 0 && (
              <p className="mt-2 text-xs md:text-sm">
                Profil sayfanızdan favori kategorilerinizi seçebilirsiniz
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover; 