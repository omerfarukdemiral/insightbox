import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserInfo, deleteInfo, SavedInfo, getUserCollections, UserCollection, createCollection, deleteCollection, updateInfoImage } from '../services/firestore';
import { generateImageForInfo } from '../services/openai';
import { FiTrash2, FiSearch, FiFilter, FiGrid, FiFolderPlus, FiX, FiAlertTriangle, FiArrowLeft, FiImage, FiCopy } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { icons } from '../utils/icons';

interface DeleteModalProps {
  collectionName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteModal = ({ collectionName, onConfirm, onCancel }: DeleteModalProps) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-zinc-900 border border-white/10 rounded-lg p-6 w-full max-w-md">
      <div className="flex items-center gap-3 mb-4 text-red-500">
        <FiAlertTriangle className="w-6 h-6" />
        <h2 className="text-xl font-bold">Koleksiyon Silinecek</h2>
      </div>
      <p className="text-gray-300 mb-6">
        <span className="font-semibold">{collectionName}</span> koleksiyonunu ve içindeki tüm bilgileri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
      </p>
      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className="bg-transparent border border-white/20 hover:border-white/40 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:bg-white/5"
        >
          İptal
        </button>
        <button
          onClick={onConfirm}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300"
        >
          Sil
        </button>
      </div>
    </div>
  </div>
);

const Collection = () => {
  const { currentUser } = useAuth();
  const [savedInfo, setSavedInfo] = useState<SavedInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [userCollections, setUserCollections] = useState<UserCollection[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('FiFolder');
  const [deleteModalInfo, setDeleteModalInfo] = useState<{ id: string; name: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);

  const loadData = async () => {
    if (!currentUser) return;
    
    try {
      const [info, collections] = await Promise.all([
        getUserInfo(currentUser.uid),
        getUserCollections(currentUser.uid)
      ]);
      
      setSavedInfo(info);
      setUserCollections(collections);
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
      toast.error('Bilgiler yüklenemedi');
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleDelete = async (infoId: string) => {
    if (!currentUser) return;

    try {
      await deleteInfo(currentUser.uid, infoId);
      setSavedInfo(savedInfo.filter(info => info.id !== infoId));
      toast.success('Bilgi silindi');
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Bilgi silinemedi');
    }
  };

  const handleCreateCollection = async () => {
    if (!currentUser || !newCollectionName.trim()) return;

    try {
      const collectionId = await createCollection(currentUser.uid, newCollectionName.trim(), selectedIcon);
      const newCollection = {
        id: collectionId,
        name: newCollectionName.trim(),
        icon: selectedIcon,
        createdAt: new Date(),
        itemCount: 0
      };
      setUserCollections([...userCollections, newCollection]);
      setNewCollectionName('');
      setSelectedIcon('FiFolder');
      setShowNewCollectionModal(false);
      toast.success('Yeni koleksiyon oluşturuldu');
    } catch (error) {
      console.error('Koleksiyon oluşturulurken hata:', error);
      toast.error('Koleksiyon oluşturulamadı');
    }
  };

  const handleDeleteCollection = async () => {
    if (!currentUser || !deleteModalInfo) return;

    try {
      await deleteCollection(currentUser.uid, deleteModalInfo.id);
      setUserCollections(userCollections.filter(col => col.id !== deleteModalInfo.id));
      if (selectedCollection === deleteModalInfo.id) {
        setSelectedCollection(null);
      }
      setDeleteModalInfo(null);
      toast.success('Koleksiyon silindi');
    } catch (error) {
      console.error('Koleksiyon silinirken hata:', error);
      toast.error('Koleksiyon silinemedi');
    }
  };

  const handleGenerateImage = async (info: SavedInfo) => {
    if (!currentUser) return;
    
    try {
      setGeneratingImage(info.id);
      const imageUrl = await generateImageForInfo(info.content, info.category);
      await updateInfoImage(currentUser.uid, info.id, imageUrl);
      
      // Yerel state'i güncelle
      setSavedInfo(savedInfo.map(item => 
        item.id === info.id ? { ...item, imageUrl } : item
      ));
      
      toast.success('Görsel oluşturuldu');
    } catch (error) {
      console.error('Görsel oluşturma hatası:', error);
      toast.error('Görsel oluşturulamadı');
    } finally {
      setGeneratingImage(null);
    }
  };

  const handleDeleteImage = async (info: SavedInfo) => {
    if (!currentUser) return;
    
    try {
      await updateInfoImage(currentUser.uid, info.id, null);
      
      // Yerel state'i güncelle
      setSavedInfo(savedInfo.map(item => 
        item.id === info.id ? { ...item, imageUrl: undefined } : item
      ));
      
      toast.success('Görsel silindi');
    } catch (error) {
      console.error('Görsel silme hatası:', error);
      toast.error('Görsel silinemedi');
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Metin kopyalandı');
  };

  const handleImageSelect = (imageUrl: string | undefined) => {
    if (imageUrl) {
      setSelectedImage(imageUrl);
    }
  };

  const filteredInfo = savedInfo.filter(info => {
    const matchesSearch = info.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || info.category === selectedCategory;
    const matchesCollection = !selectedCollection || info.collectionId === selectedCollection;
    return matchesSearch && matchesCategory && matchesCollection;
  });

  const categoryCounts = savedInfo.reduce((acc, info) => {
    if (info.collectionId === selectedCollection) {
      acc[info.category] = (acc[info.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  if (!currentUser) {
    return (
      <div className="min-h-screen pt-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Koleksiyon</h1>
          <p>Bu sayfayı görüntülemek için giriş yapmalısınız.</p>
        </div>
      </div>
    );
  }

  const renderCollectionList = () => (
    <>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Kişiye Özel Koleksiyonlar</h2>
        <button
          onClick={() => setShowNewCollectionModal(true)}
          className="bg-white text-zinc-900 px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100 flex items-center gap-2"
        >
          <FiFolderPlus className="w-5 h-5" />
          <span>Yeni Koleksiyon</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userCollections.map(collection => {
          const IconComponent = icons[collection.icon || 'FiFolder'];
          return (
            <div
              key={collection.id}
              className="bg-zinc-900/50 border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedCollection(collection.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{collection.name}</h3>
                    <p className="text-sm text-gray-400">{collection.itemCount} bilgi</p>
                  </div>
                </div>
                {collection.name !== 'Genel' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteModalInfo({ id: collection.id, name: collection.name });
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  const renderCollectionContent = () => {
    const collection = userCollections.find(c => c.id === selectedCollection);
    if (!collection) return null;

    return (
      <>
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setSelectedCollection(null)}
            className="bg-transparent border border-white/20 hover:border-white/40 text-white p-2 rounded-lg transition-all duration-300 hover:bg-white/5"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold">{collection.name}</h2>
            <p className="text-gray-400">{collection.itemCount} bilgi</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Bilgilerde ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-white/20 text-white rounded-lg focus:outline-none focus:border-white/40"
            />
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg border transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-white text-zinc-900'
                  : 'bg-transparent border-white/20 text-white hover:bg-white/5'
              }`}
            >
              <FiFilter className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg border transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-white text-zinc-900'
                  : 'bg-transparent border-white/20 text-white hover:bg-white/5'
              }`}
            >
              <FiGrid className="w-5 h-5" />
            </button>
          </div>
        </div>

        {Object.keys(categoryCounts).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-white/80">Kategoriler</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
                  !selectedCategory
                    ? 'bg-white text-zinc-900'
                    : 'bg-transparent border-white/20 text-white hover:bg-white/5'
                }`}
              >
                Tümü
              </button>
              {Object.entries(categoryCounts).map(([category, count]) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-white text-zinc-900'
                      : 'bg-transparent border-white/20 text-white hover:bg-white/5'
                  }`}
                >
                  {category} ({count})
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredInfo.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'grid gap-4'}>
            {filteredInfo.map((info) => (
              <div key={info.id} className="bg-zinc-900/50 border border-white/10 rounded-lg overflow-hidden">
                {/* Üst Kısım - Kategoriler */}
                <div className="px-6 pt-4 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-sm">
                      {info.category}
                    </span>
                    {info.subCategory && (
                      <span className="px-3 py-1 rounded-full bg-accent-purple/10 text-accent-purple border border-accent-purple/20 text-sm">
                        {info.subCategory}
                      </span>
                    )}
                  </div>
                </div>

                {/* Orta Kısım - İçerik ve Görsel */}
                <div className="p-6">
                  <p className="leading-relaxed text-gray-200 mb-4">{info.content}</p>
                  {info.imageUrl && (
                    <div className="relative group mb-4">
                      <img 
                        src={info.imageUrl} 
                        alt="Bilgi görseli"
                        className="w-full h-48 object-cover rounded-lg cursor-pointer"
                        onClick={() => handleImageSelect(info.imageUrl)}
                      />
                      <button
                        onClick={() => handleDeleteImage(info)}
                        className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Alt Kısım - Footer */}
                <div className="px-6 py-3 bg-black/20 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGenerateImage(info)}
                      disabled={!!generatingImage}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-purple hover:bg-accent-purple/80 text-white transition-all duration-300 ${
                        generatingImage === info.id ? 'animate-pulse' : ''
                      }`}
                    >
                      <FiImage className="w-4 h-4" />
                      <span className="text-sm">Görsel Oluştur</span>
                    </button>
                    <button
                      onClick={() => handleCopyContent(info.content)}
                      className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                      title="Metni Kopyala"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-400 mr-4">
                      {new Date(info.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                    <button
                      onClick={() => handleDelete(info.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-white/5"
                      title="Sil"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            {searchTerm || selectedCategory ? (
              <p>Aramanızla eşleşen bilgi bulunamadı.</p>
            ) : (
              <p>Bu koleksiyonda henüz bilgi yok.</p>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen pt-24 px-8">
      <div className="max-w-4xl mx-auto">
        {selectedCollection ? renderCollectionContent() : renderCollectionList()}

        {showNewCollectionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-white/10 rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Yeni Koleksiyon Oluştur</h2>
                <button
                  onClick={() => setShowNewCollectionModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Koleksiyon adı"
                className="w-full bg-zinc-800 border border-white/20 text-white rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-white/40"
              />
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">İkon Seç</label>
                <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 bg-zinc-800 rounded-lg border border-white/20">
                  {Object.entries(icons).map(([key, Icon]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedIcon(key)}
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        selectedIcon === key
                          ? 'bg-white text-zinc-900'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowNewCollectionModal(false)}
                  className="bg-transparent border border-white/20 hover:border-white/40 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:bg-white/5"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateCollection}
                  className="bg-white text-zinc-900 px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100"
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteModalInfo && (
          <DeleteModal
            collectionName={deleteModalInfo.name}
            onConfirm={handleDeleteCollection}
            onCancel={() => setDeleteModalInfo(null)}
          />
        )}

        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8 cursor-pointer"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl w-full">
              <img 
                src={selectedImage} 
                alt="Büyütülmüş görsel" 
                className="w-full h-auto rounded-lg"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Collection; 