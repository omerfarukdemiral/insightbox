import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  setDoc,
  getDoc,
  orderBy,
  writeBatch,
  updateDoc
} from '@firebase/firestore';
import { db } from '../config/firebase';
import { Category } from './openai';

export interface SubCategory {
  id: string;
  name: string;
  description: string;
  parentCategory: Category;
}

export interface SavedInfo {
  id: string;
  content: string;
  category: Category;
  subCategory?: string;
  collectionId: string;
  createdAt: Date;
}

export interface UserCollection {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  createdAt: Date;
  itemCount: number;
}

export interface UserPreferences {
  favoriteCategories: Category[];
  lastUpdated: Date;
}

export interface UserSubCategoryPreferences {
  selectedSubCategories: Record<Category, string[]>;
  lastUpdated: Date;
}

// Koleksiyon oluşturma
export const createCollection = async (userId: string, name: string, icon: string = 'FiFolder') => {
  const collectionsRef = collection(db, 'users', userId, 'collections');
  const newCollectionRef = doc(collectionsRef);

  await setDoc(newCollectionRef, {
    name,
    icon,
    createdAt: serverTimestamp(),
    itemCount: 0
  });

  return newCollectionRef.id;
};

// Koleksiyonları getirme
export const getUserCollections = async (userId: string): Promise<UserCollection[]> => {
  try {
    const collectionsRef = collection(db, 'users', userId, 'collections');
    const querySnapshot = await getDocs(collectionsRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate()
    })) as UserCollection[];
  } catch (error) {
    console.error('Koleksiyonlar alınırken hata:', error);
    throw error;
  }
};

// Koleksiyon silme
export const deleteCollection = async (userId: string, collectionId: string) => {
  try {
    // Önce koleksiyondaki tüm bilgileri sil
    const savedInfoRef = collection(db, 'users', userId, 'savedInfo');
    const q = query(savedInfoRef, where('collectionId', '==', collectionId));
    const querySnapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Sonra koleksiyonu sil
    const collectionRef = doc(db, 'users', userId, 'collections', collectionId);
    batch.delete(collectionRef);
    
    await batch.commit();
  } catch (error) {
    console.error('Koleksiyon silinirken hata:', error);
    throw error;
  }
};

// Bilgi kaydetme
export const saveInfo = async (
  userId: string, 
  content: string, 
  category: Category, 
  collectionId: string,
  subCategory?: string
) => {
  try {
    const infoRef = doc(collection(db, 'users', userId, 'savedInfo'));
    await setDoc(infoRef, {
      content,
      category,
      collectionId,
      subCategory,
      createdAt: new Date()
    });

    // Koleksiyondaki bilgi sayısını güncelle
    const collectionRef = doc(db, 'users', userId, 'collections', collectionId);
    const collectionDoc = await getDoc(collectionRef);
    if (collectionDoc.exists()) {
      await setDoc(collectionRef, {
        ...collectionDoc.data(),
        itemCount: (collectionDoc.data().itemCount || 0) + 1
      }, { merge: true });
    }

    return infoRef.id;
  } catch (error) {
    console.error('Bilgi kaydedilirken hata:', error);
    throw error;
  }
};

// Kaydedilen bilgileri getirme
export const getUserInfo = async (userId: string): Promise<SavedInfo[]> => {
  try {
    const savedInfoRef = collection(db, 'users', userId, 'savedInfo');
    const querySnapshot = await getDocs(savedInfoRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate()
    })) as SavedInfo[];
  } catch (error) {
    console.error('Kaydedilen bilgiler alınırken hata:', error);
    throw error;
  }
};

// Bilgi silme
export const deleteInfo = async (userId: string, infoId: string) => {
  try {
    const infoRef = doc(db, 'users', userId, 'savedInfo', infoId);
    const infoDoc = await getDoc(infoRef);
    
    if (infoDoc.exists()) {
      const { collectionId } = infoDoc.data();
      await deleteDoc(infoRef);

      // Koleksiyondaki bilgi sayısını güncelle
      const collectionRef = doc(db, 'users', userId, 'collections', collectionId);
      const collectionDoc = await getDoc(collectionRef);
      if (collectionDoc.exists()) {
        await setDoc(collectionRef, {
          ...collectionDoc.data(),
          itemCount: Math.max((collectionDoc.data().itemCount || 1) - 1, 0)
        }, { merge: true });
      }
    }
  } catch (error) {
    console.error('Bilgi silinirken hata:', error);
    throw error;
  }
};

// Alt kategorilerin başlatılıp başlatılmadığını kontrol etme
export const checkSubCategoriesInitialized = async (): Promise<boolean> => {
  try {
    const initRef = doc(db, 'system', 'subcategories');
    const docSnap = await getDoc(initRef);
    
    // Doküman yoksa veya initialized değeri false ise false döndür
    if (!docSnap.exists()) {
      return false;
    }
    
    const data = docSnap.data();
    return data?.initialized === true;
  } catch (error) {
    console.error('Alt kategori kontrolü yapılırken hata:', error);
    return false; // Hata durumunda false döndürerek yeniden başlatmayı tetikle
  }
};

// Alt kategorilerin başlatıldığını işaretleme
export const markSubCategoriesInitialized = async () => {
  try {
    const initRef = doc(db, 'system', 'subcategories');
    await setDoc(initRef, {
      initialized: true,
      lastUpdated: serverTimestamp()
    });
    console.log('Alt kategoriler başarıyla işaretlendi.');
  } catch (error) {
    console.error('Alt kategori durumu güncellenirken hata:', error);
    throw error;
  }
};

// Alt kategorileri kaydetme
export const saveSubCategories = async (subcategories: SubCategory[]) => {
  try {
    const batch = writeBatch(db);
    const subcategoriesRef = collection(db, 'subcategories');

    // Her alt kategori için benzersiz bir ID oluştur
    subcategories.forEach(subcategory => {
      const docRef = doc(subcategoriesRef);
      batch.set(docRef, {
        ...subcategory,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();
    console.log(`${subcategories.length} alt kategori başarıyla kaydedildi.`);
  } catch (error) {
    console.error('Alt kategoriler kaydedilirken hata:', error);
    throw error;
  }
};

// Alt kategorileri getirme
export const getSubCategories = async (parentCategory?: Category): Promise<SubCategory[]> => {
  try {
    const subcategoriesRef = collection(db, 'subcategories');
    let q = query(subcategoriesRef);
    
    if (parentCategory) {
      q = query(subcategoriesRef, where('parentCategory', '==', parentCategory));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SubCategory[];
  } catch (error) {
    console.error('Alt kategoriler alınırken hata:', error);
    throw error;
  }
};

// Kullanıcının seçtiği alt kategorileri kaydetme
export const saveUserSubCategories = async (userId: string, selectedSubCategories: Record<Category, string[]>) => {
  try {
    // Sadece özel seçimleri kaydet (boş olmayan dizileri)
    const filteredSelections = Object.entries(selectedSubCategories).reduce((acc, [category, selections]) => {
      if (selections && selections.length > 0) {
        acc[category] = selections;
      }
      return acc;
    }, {} as Record<Category, string[]>);

    const userPrefsRef = doc(db, 'userPreferences', userId);
    await setDoc(userPrefsRef, {
      selectedSubCategories: filteredSelections,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    
    console.log('Alt kategori tercihleri kaydedildi:', filteredSelections);
    return true;
  } catch (error) {
    console.error('Alt kategoriler kaydedilirken hata:', error);
    throw error;
  }
};

// Kullanıcının seçtiği alt kategorileri getirme
export const getUserSubCategories = async (userId: string): Promise<Record<Category, string[]>> => {
  try {
    const userPrefsRef = doc(db, 'userPreferences', userId);
    const docSnap = await getDoc(userPrefsRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as UserSubCategoryPreferences;
      // Sadece özel seçimleri döndür
      return data.selectedSubCategories || {};
    }
    return {};
  } catch (error) {
    console.error('Alt kategoriler alınırken hata:', error);
    throw error;
  }
};

// Favori kategorileri kaydetme
export const saveFavoriteCategories = async (userId: string, categories: Category[]) => {
  try {
    const userPrefsRef = doc(db, 'userPreferences', userId);
    await setDoc(userPrefsRef, {
      favoriteCategories: categories,
      lastUpdated: new Date()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Favori kategoriler kaydedilirken hata:', error);
    throw error;
  }
};

// Favori kategorileri getirme
export const getFavoriteCategories = async (userId: string): Promise<Category[]> => {
  try {
    const userPrefsRef = doc(db, 'userPreferences', userId);
    const docSnap = await getDoc(userPrefsRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as UserPreferences;
      return data.favoriteCategories || [];
    }
    return [];
  } catch (error) {
    console.error('Favori kategoriler alınırken hata:', error);
    throw error;
  }
};

// Favori kategorileri güncelleme
export const updateFavoriteCategories = async (userId: string, categories: Category[]) => {
  return saveFavoriteCategories(userId, categories);
};

export const initSubCategories = async (userId: string, categories: any) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Kullanıcı dökümanı yoksa oluştur
      await setDoc(userDocRef, {
        categories: categories,
        createdAt: serverTimestamp()
      });
    } else {
      // Varolan kategorileri güncelle
      await updateDoc(userDocRef, {
        categories: categories,
        updatedAt: serverTimestamp()
      });
    }
    return true;
  } catch (error) {
    console.error('Alt kategoriler kaydedilirken hata:', error);
    return false;
  }
};

export const updateSubCategories = async (
  userId: string, 
  categoryId: Category, 
  selectedSubCategories: SubCategory[]
) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userPreferences = userDoc.data().preferences || {};
      
      await updateDoc(userDocRef, {
        [`preferences.${categoryId}`]: {
          selectedSubCategories: selectedSubCategories,
          updatedAt: serverTimestamp()
        }
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Alt kategoriler güncellenirken hata:', error);
    return false;
  }
}; 