import { useState, useEffect } from 'react';
import { Category } from '../services/openai';
import { SubCategory, getSubCategories } from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';
import { FiX, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface SubCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: Category;
  initialSelectedSubCategories: string[];
  onSave: (selectedIds: string[]) => void;
}

const SubCategoryModal = ({
  isOpen,
  onClose,
  selectedCategory,
  initialSelectedSubCategories,
  onSave
}: SubCategoryModalProps) => {
  const { currentUser } = useAuth();
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCustomSelection, setHasCustomSelection] = useState(false);

  useEffect(() => {
    const loadSubCategories = async () => {
      if (!selectedCategory) return;
      
      try {
        setLoading(true);
        const subCats = await getSubCategories(selectedCategory);
        setSubCategories(subCats);
        
        // Eğer özel seçim varsa onu kullan, yoksa tümünü seç
        if (initialSelectedSubCategories.length > 0) {
          setSelectedIds(initialSelectedSubCategories);
          setHasCustomSelection(true);
        } else {
          setSelectedIds(subCats.map(cat => cat.id));
          setHasCustomSelection(false);
        }
      } catch (error) {
        console.error('Alt kategoriler yüklenirken hata:', error);
        toast.error('Alt kategoriler yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadSubCategories();
    }
  }, [selectedCategory, isOpen, initialSelectedSubCategories]);

  const toggleSubCategory = (subCategoryId: string) => {
    setHasCustomSelection(true);
    setSelectedIds(prev => 
      prev.includes(subCategoryId)
        ? prev.filter(id => id !== subCategoryId)
        : [...prev, subCategoryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === subCategories.length) {
      // Tüm seçimleri kaldır
      setSelectedIds([]);
      setHasCustomSelection(true);
    } else {
      // Tümünü seç
      setSelectedIds(subCategories.map(cat => cat.id));
      setHasCustomSelection(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      // Eğer özel seçim yoksa boş dizi gönder (tümü seçili anlamına gelir)
      onSave(hasCustomSelection ? selectedIds : []);
      onClose();
      toast.success('Alt kategori tercihleri kaydedildi');
    } catch (error) {
      console.error('Alt kategoriler kaydedilirken hata:', error);
      toast.error('Alt kategoriler kaydedilemedi');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-zinc-900 border border-white/10 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">
              {selectedCategory} Alt Kategorileri
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Bu kategoride kullanmak istediğiniz alt kategorileri seçin
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-12 h-12 border-t-2 border-white rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-400">
                {selectedIds.length} / {subCategories.length} seçili
              </div>
              <button
                onClick={handleSelectAll}
                className="text-sm text-accent-purple hover:text-accent-purple/80 transition-colors"
              >
                {selectedIds.length === subCategories.length ? 'Tüm Seçimleri Kaldır' : 'Tümünü Seç'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {subCategories.map((subCategory) => (
                  <button
                    key={subCategory.id}
                    onClick={() => toggleSubCategory(subCategory.id)}
                    className={`p-4 rounded-lg border text-left transition-all duration-300 ${
                      selectedIds.includes(subCategory.id)
                        ? 'bg-white text-zinc-900 border-white'
                        : 'bg-transparent border-white/20 text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold">{subCategory.name}</h4>
                        <p className="text-sm mt-1 opacity-80">{subCategory.description}</p>
                      </div>
                      <div className={`p-1 rounded-full ${
                        selectedIds.includes(subCategory.id) ? 'bg-zinc-900' : 'bg-white/10'
                      }`}>
                        <FiCheck className={`w-4 h-4 ${
                          selectedIds.includes(subCategory.id) ? 'text-white' : 'opacity-0'
                        }`} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-white/10">
              <button
                onClick={onClose}
                className="bg-transparent border border-white/20 hover:border-white/40 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:bg-white/5"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                className="bg-white text-zinc-900 px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-100"
              >
                Kaydet
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SubCategoryModal; 