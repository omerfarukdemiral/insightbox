import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserInfo, SavedInfo, getUserSubCategories, saveUserSubCategories, getSubCategories } from '../services/firestore';
import { FiMail, FiUser, FiCalendar, FiBookmark, FiTag, FiGithub, FiGlobe, FiSettings, FiStar } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { Category, CategoryInfo, categories } from '../services/openai';
import { getFavoriteCategories, updateFavoriteCategories } from '../services/firestore';
import { toast } from 'react-hot-toast';
import SubCategoryModal from '../components/SubCategoryModal';

const Profile = () => {
  const { currentUser } = useAuth();
  const [userStats, setUserStats] = useState<{
    totalItems: number;
    categories: Record<string, number>;
  }>({ totalItems: 0, categories: {} });
  const [loading, setLoading] = useState(true);
  const [favoriteCategories, setFavoriteCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategories, setSelectedSubCategories] = useState<Record<Category, string[]>>({});
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [totalSubCategories, setTotalSubCategories] = useState<Record<Category, number>>({});

  useEffect(() => {
    const loadUserStats = async () => {
      if (!currentUser) return;

      try {
        const info = await getUserInfo(currentUser.uid);
        const categories = info.reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setUserStats({
          totalItems: info.length,
          categories
        });
      } catch (error) {
        console.error('Kullanıcı istatistikleri yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserStats();
  }, [currentUser]);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
      
      try {
        const [favorites, userSubCats, allSubCategories] = await Promise.all([
          getFavoriteCategories(currentUser.uid),
          getUserSubCategories(currentUser.uid),
          Promise.all(categories.map(cat => getSubCategories(cat.id)))
        ]);
        
        setFavoriteCategories(favorites);
        setSelectedSubCategories(userSubCats);
        
        // Her kategori için toplam alt kategori sayısını sakla
        const totalSubCategoryCounts = categories.reduce((acc, cat, index) => {
          acc[cat.id] = allSubCategories[index].length;
          return acc;
        }, {} as Record<Category, number>);
        
        setTotalSubCategories(totalSubCategoryCounts);
      } catch (error) {
        console.error('Veriler yüklenirken hata:', error);
        toast.error('Veriler yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const toggleFavorite = async (categoryId: Category) => {
    if (!currentUser) return;

    try {
      const newFavorites = favoriteCategories.includes(categoryId)
        ? favoriteCategories.filter(id => id !== categoryId)
        : [...favoriteCategories, categoryId];

      await updateFavoriteCategories(currentUser.uid, newFavorites);
      setFavoriteCategories(newFavorites);
      
      toast.success(
        favoriteCategories.includes(categoryId)
          ? 'Kategori favorilerden kaldırıldı'
          : 'Kategori favorilere eklendi'
      );
    } catch (error) {
      console.error('Favori güncellenirken hata:', error);
      toast.error('Favori güncellenemedi');
    }
  };

  const handleSaveSubCategories = async (selectedIds: string[]) => {
    if (!currentUser || !selectedCategory) return;

    try {
      const updatedSubCategories = {
        ...selectedSubCategories,
        [selectedCategory]: selectedIds
      };

      await saveUserSubCategories(currentUser.uid, updatedSubCategories);
      setSelectedSubCategories(updatedSubCategories);
      setShowSubCategoryModal(false);
      toast.success('Alt kategori tercihleri kaydedildi');
    } catch (error) {
      console.error('Alt kategoriler kaydedilirken hata:', error);
      toast.error('Alt kategoriler kaydedilemedi');
    }
  };

  if (!currentUser) {
    return null;
  }

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google.com':
        return <FcGoogle className="w-5 h-5" />;
      case 'github.com':
        return <FiGithub className="w-5 h-5" />;
      default:
        return <FiGlobe className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen pt-24 px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profil</h1>

        <div className="grid gap-6">
          {/* Profil Kartı */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Profil fotoğrafı"
                    className="w-32 h-32 rounded-full border-4 border-white/10 transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-zinc-800 border-4 border-white/10 flex items-center justify-center transition-transform group-hover:scale-105">
                    <FiUser className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-zinc-800 rounded-full border border-white/10">
                  {getProviderIcon(currentUser.providerData[0]?.providerId || '')}
                </div>
              </div>

              <div className="flex-1 space-y-4 text-center md:text-left">
                <h2 className="text-2xl font-bold text-white">
                  {currentUser.displayName || 'İsimsiz Kullanıcı'}
                </h2>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-center md:justify-start text-gray-400">
                    <FiMail className="w-5 h-5 mr-2" />
                    <span>{currentUser.email}</span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start text-gray-400">
                    <FiCalendar className="w-5 h-5 mr-2" />
                    <span>
                      {`Katılma: ${new Date(currentUser.metadata.creationTime || '').toLocaleDateString('tr-TR')}`}
                    </span>
                  </div>
                  {currentUser.emailVerified && (
                    <div className="inline-flex items-center justify-center md:justify-start">
                      <span className="px-3 py-1 text-sm bg-white/10 text-white rounded-full border border-white/20">
                        E-posta Doğrulandı
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Kategori Tercihleri Kartı */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-6">Kategori Tercihleri</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => {
                const Icon = category.icon;
                const selectedCount = selectedSubCategories[category.id]?.length || 0;
                const totalCount = totalSubCategories[category.id] || 0;
                const hasCustomSelection = selectedCount > 0;

                return (
                  <div
                    key={category.id}
                    className="flex flex-col p-4 bg-zinc-800/50 rounded-lg border border-white/10 hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-gray-400" />
                        <h4 className="font-medium text-white">{category.name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFavorite(category.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            favoriteCategories.includes(category.id)
                              ? 'text-yellow-500 hover:bg-yellow-500/10'
                              : 'text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          <FiStar 
                            className={`w-5 h-5 ${favoriteCategories.includes(category.id) ? 'fill-current' : ''}`} 
                          />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setShowSubCategoryModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <FiSettings className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-2">{category.description}</p>
                      <div className="text-sm text-gray-400">
                        {hasCustomSelection ? (
                          <span>{selectedCount} alt kategori seçili</span>
                        ) : (
                          <span>Tümü ({totalCount} alt kategori)</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* İstatistikler Kartı */}
          {!loading && (
            <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-6">Koleksiyon İstatistikleri</h3>
              <div className="grid gap-6">
                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-white/10">
                  <div className="flex items-center">
                    <FiBookmark className="w-5 h-5 text-white mr-3" />
                    <span>Toplam Kayıt</span>
                  </div>
                  <span className="text-xl font-bold text-white">{userStats.totalItems}</span>
                </div>

                {Object.entries(userStats.categories).length > 0 && (
                  <div className="space-y-4">
                    <div className="text-gray-400">Kategori Dağılımı</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(userStats.categories)
                        .sort(([, a], [, b]) => b - a)
                        .map(([category, count]) => (
                          <div
                            key={category}
                            className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-white/10"
                          >
                            <div className="flex items-center">
                              <FiTag className="w-4 h-4 text-white mr-2" />
                              <span>{category}</span>
                            </div>
                            <span className="font-bold text-white">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedCategory && (
        <SubCategoryModal
          isOpen={showSubCategoryModal}
          onClose={() => {
            setShowSubCategoryModal(false);
            setSelectedCategory(null);
          }}
          selectedCategory={selectedCategory}
          initialSelectedSubCategories={selectedSubCategories[selectedCategory] || []}
          onSave={handleSaveSubCategories}
        />
      )}
    </div>
  );
};

export default Profile; 