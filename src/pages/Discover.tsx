import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { categories, getRandomInfo, Category } from '../services/openai';
import { 
  saveInfo, 
  getUserInfo, 
  getUserCollections, 
  createCollection, 
  UserCollection, 
  SubCategory,
  getSubCategories,
  getUserSubCategories,
  saveUserSubCategories
} from '../services/firestore';
import { getFavoriteCategories } from '../services/firestore';
import { toast } from 'react-hot-toast';
import { 
  FiSave, 
  FiStar, 
  FiRefreshCw, 
  FiFolderPlus, 
  FiX, 
  FiSettings, 
  FiZap 
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
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('FiFolder');
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

  const handleCreateCollection = async () => {
    if (!currentUser || !selectedIcon) return;

    try {
      const collectionId = await createCollection(currentUser.uid, selectedIcon);
      const newCollection = {
        id: collectionId,
        name: selectedIcon,
        icon: selectedIcon,
        createdAt: new Date(),
        itemCount: 0
      };
      setUserCollections([...userCollections, newCollection]);
      setSelectedCollectionId(collectionId);
      setSelectedIcon('FiFolder');
      setShowCollectionModal(false);
      
      toast.success('Yeni koleksiyon oluşturuldu');
    } catch (error) {
      console.error('Koleksiyon oluşturulurken hata:', error);
      toast.error('Koleksiyon oluşturulamadı');
    }
  };

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

  const handleTestInfo = async () => {
    try {
      setLoading(true);
      setSelectedSubCategory(null);
      
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      setSelectedCategory(randomCategory.id);
      
      // Alt kategorileri al
      const categorySubCategories = await getSubCategories(randomCategory.id);
      
      // Kullanıcının seçili alt kategorilerini kontrol et
      const userSelectedSubCategories = selectedSubCategories[randomCategory.id] || [];
      
      // Eğer kullanıcı özel seçim yaptıysa onlar arasından, yapmadıysa tüm alt kategorilerden seç
      const availableSubCategories = userSelectedSubCategories.length > 0
        ? categorySubCategories.filter(subCat => userSelectedSubCategories.includes(subCat.id))
        : categorySubCategories;
      
      // Rastgele bir alt kategori seç
      const randomSubCategory = availableSubCategories[Math.floor(Math.random() * availableSubCategories.length)];
      
      // Bilgiyi al
      const info = await getRandomInfo(randomCategory.id, randomSubCategory.name);
      setCurrentInfo(info);
      setSelectedSubCategory(randomSubCategory.name);
      toast.success('Test bilgisi alındı');
    } catch (error) {
      console.error('Test bilgisi alınırken hata:', error);
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

  const handleSaveSubCategories = async () => {
    if (!currentUser || !selectedCategory) return;

    try {
      await saveUserSubCategories(currentUser.uid, selectedSubCategories);
      toast.success('Alt kategori tercihleri kaydedildi');
    } catch (error) {
      console.error('Alt kategoriler kaydedilirken hata:', error);
      toast.error('Alt kategoriler kaydedilemedi');
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
    <div className="min-h-screen pt-24 px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Yeni Bilgiler Keşfet</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleTestInfo}
              className="flex items-center gap-2 px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/90 transition-colors"
              disabled={loading}
            >
              <FiZap className="w-4 h-4" />
              <span>{loading ? 'Yükleniyor...' : 'Rastgele Bilgi Al'}</span>
            </button>
            <Link 
              to="/profile"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <FiSettings className="w-5 h-5" />
              <span>Kategorileri Düzenle</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          {sortedCategories.map(category => {
            const Icon = category.icon;
            const isFavorite = favoriteCategories.includes(category.id);
            const selectedCount = selectedSubCategories[category.id]?.length || 0;
            const hasSpecificSelection = selectedCount > 0;
            
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id, category.name)}
                className={`relative group overflow-hidden bg-transparent border border-white/20 hover:border-white/40 rounded-lg p-4 transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'border-white text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                disabled={loading}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Icon className="w-6 h-6 transform group-hover:scale-110 transition-transform duration-300" />
                  <span>{category.name}</span>
                  <div className="px-2 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple text-xs">
                    {hasSpecificSelection ? `${selectedCount} Alt Kategori` : 'Tümü'}
                  </div>
                </div>
                {isFavorite && (
                  <div className="absolute top-2 right-2">
                    <FiStar className="w-4 h-4 text-accent-purple" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedCategory && (
          <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-6 space-y-6">
            {loading ? (
              <div className="flex justify-center">
                <div className="w-12 h-12 border-t-2 border-white rounded-full animate-spin"></div>
              </div>
            ) : currentInfo ? (
              <>
                <div className="space-y-4">
                  <p className="leading-relaxed text-gray-200">{currentInfo}</p>
                  {selectedSubCategory && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Alt Kategori:</span>
                      <span className="px-2 py-1 bg-accent-purple/20 text-accent-purple rounded-full text-sm">
                        {selectedSubCategory}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleCategoryClick(selectedCategory, categories.find(c => c.id === selectedCategory)?.name || '')}
                      className="flex-shrink-0 bg-transparent border border-white/20 hover:border-white/40 text-white px-6 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all duration-300 hover:bg-white/5"
                      disabled={loading}
                    >
                      <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      <span>Yeni Bilgi</span>
                    </button>
                  </div>

                  {currentUser && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        value={selectedCollectionId}
                        onChange={(e) => setSelectedCollectionId(e.target.value)}
                        className="flex-1 sm:w-48 bg-zinc-800 border border-white/20 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-white/40"
                      >
                        {userCollections.map(collection => (
                          <option key={collection.id} value={collection.id}>
                            {collection.name} ({collection.itemCount})
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => setShowCollectionModal(true)}
                        className="flex-shrink-0 bg-transparent border border-white/20 hover:border-white/40 text-white p-2.5 rounded-lg transition-all duration-300 hover:bg-white/5"
                      >
                        <FiFolderPlus className="w-5 h-5" />
                      </button>

                      <button
                        onClick={handleSave}
                        className="flex-shrink-0 bg-white text-zinc-900 px-6 py-2.5 rounded-lg flex items-center space-x-2 transition-all duration-300 hover:bg-gray-100"
                      >
                        <FiSave className="w-4 h-4" />
                        <span>Kaydet</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-gray-400">Bilgi yüklenemedi. Lütfen tekrar deneyin.</p>
            )}
          </div>
        )}

        {!selectedCategory && (
          <div className="text-center py-12 text-gray-400">
            <p>Başlamak için bir kategori seçin</p>
            {currentUser && favoriteCategories.length === 0 && (
              <p className="mt-2 text-sm">
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