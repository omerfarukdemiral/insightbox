import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  FiArrowUp,
  FiArrowDown,
  FiUser,
  FiFolder
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { db, auth } from "../config/firebase";
import { 
  collection,
  getDocs,
  doc,
  getDoc,
  Timestamp,
  DocumentData,
  setDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { saveVote } from '../services/firestore';

interface Collection {
  id: string;
  name: string;
  icon?: string;
  createdAt: Timestamp;
  itemCount: number;
}

interface SavedInfo {
  id: string;
  userId: string;
  content: string;
  category: string;
  subCategory?: string;
  createdAt: Timestamp;
  collectionId: string;
  collectionName: string;
  collectionIcon?: string;
  votes: {
    up: string[];
    down: string[];
  };
  userDisplayName?: string;
  userPhotoURL?: string;
  userEmail?: string;
}

interface InfoWithVotes extends SavedInfo {
  voteCount: number;
  userVote?: 'up' | 'down' | null;
}

const Home = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [savedInfos, setSavedInfos] = useState<InfoWithVotes[]>([]);

  useEffect(() => {
    loadFeedItems();
  }, []);

  // Koleksiyon bilgilerini çekme fonksiyonu
  const getCollectionDetails = async (userId: string, collectionId: string) => {
    try {
      const collectionRef = doc(db, 'users', userId, 'collections', collectionId);
      const collectionDoc = await getDoc(collectionRef);
      
      if (collectionDoc.exists()) {
        const collectionData = collectionDoc.data() as Collection;
        return {
          name: collectionData.name,
          icon: collectionData.icon || "FiFolder"
        };
      }
      
      console.error(`Koleksiyon bulunamadı: ${collectionId}`);
      return null;
    } catch (error) {
      console.error(`Koleksiyon bilgileri alınamadı (${collectionId}):`, error);
      return null;
    }
  };

  const loadFeedItems = async () => {
    try {
      setLoading(true);
      console.log('Feed yükleme başladı');
      
      // Önce kullanıcı dokümanını kontrol et ve gerekirse oluştur
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          console.log('Kullanıcı dokümanı bulunamadı, oluşturuluyor...');
          try {
            await setDoc(userRef, {
              email: auth.currentUser.email,
              displayName: auth.currentUser.displayName,
              photoURL: auth.currentUser.photoURL,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            console.log('Kullanıcı dokümanı oluşturuldu');
          } catch (error) {
            console.error('Kullanıcı dokümanı oluşturulurken hata:', error);
          }
        } else {
          console.log('Mevcut kullanıcı dokümanı:', userDoc.data());
        }
      }
      
      // 1. Tüm kullanıcıları al
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      console.log('Kullanıcı sayısı:', usersSnapshot.docs.length);
      
      // 2. Her kullanıcının savedInfo koleksiyonunu al
      const allInfos = await Promise.all(
        usersSnapshot.docs.map(async (userDoc) => {
          try {
            const userData = userDoc.data() as DocumentData;
            const savedInfoRef = collection(db, 'users', userDoc.id, 'savedInfo');
            const savedInfoSnapshot = await getDocs(savedInfoRef);
            
            // Her bir savedInfo için işlem yap
            return Promise.all(
              savedInfoSnapshot.docs.map(async (infoDoc) => {
                const infoData = infoDoc.data() as SavedInfo;
                
                // Koleksiyon bilgilerini çek
                const collectionDetails = await getCollectionDetails(userDoc.id, infoData.collectionId);

                return {
                  ...infoData,
                  id: infoDoc.id,
                  userId: userDoc.id,
                  userDisplayName: userData.displayName,
                  userPhotoURL: userData.photoURL,
                  userEmail: userData.email,
                  collectionName: collectionDetails?.name || infoData.collectionName || 'Koleksiyon Bulunamadı',
                  collectionIcon: collectionDetails?.icon || 'FiFolder',
                  voteCount: (infoData.votes?.up?.length || 0) - (infoData.votes?.down?.length || 0),
                  userVote: auth.currentUser 
                    ? infoData.votes?.up?.includes(auth.currentUser.uid)
                      ? 'up'
                      : infoData.votes?.down?.includes(auth.currentUser.uid)
                      ? 'down'
                      : null
                    : null
                } as InfoWithVotes;
              })
            );
          } catch (error) {
            console.error(`Kullanıcı ${userDoc.id} için veri çekme hatası:`, error);
            return [];
          }
        })
      );

      const flattenedInfos = allInfos.flat();
      console.log('Toplam bilgi sayısı:', flattenedInfos.length);
      
      const sortedInfos = flattenedInfos.sort((a, b) => 
        b.createdAt.toMillis() - a.createdAt.toMillis()
      );

      setSavedInfos(sortedInfos);
    } catch (error) {
      console.error('Feed yüklenirken hata:', error);
      toast.error('Bilgiler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Oyları gerçek zamanlı dinle
  useEffect(() => {
    if (savedInfos.length === 0) return;

    // Her bir bilgi için oy dinleyicisi oluştur
    const unsubscribes = savedInfos.map(info => {
      const votesRef = collection(db, 'votes');
      const q = query(votesRef, where('infoId', '==', info.id));

      return onSnapshot(q, (snapshot) => {
        const votes = {
          up: [] as string[],
          down: [] as string[]
        };

        snapshot.docs.forEach(doc => {
          const voteData = doc.data();
          if (voteData.type === 'up') {
            votes.up.push(voteData.userId);
          } else {
            votes.down.push(voteData.userId);
          }
        });

        // Yerel state'i güncelle
        setSavedInfos(prevInfos =>
          prevInfos.map(item => {
            if (item.id === info.id) {
              return {
                ...item,
                votes,
                voteCount: votes.up.length - votes.down.length,
                userVote: auth.currentUser
                  ? votes.up.includes(auth.currentUser.uid)
                    ? 'up'
                    : votes.down.includes(auth.currentUser.uid)
                    ? 'down'
                    : null
                  : null
              };
            }
            return item;
          })
        );
      });
    });

    // Cleanup function
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [savedInfos.length]);

  const handleVote = async (itemId: string, voteType: 'up' | 'down') => {
    if (!auth.currentUser) {
      toast.error('Oy vermek için giriş yapmalısınız');
      return;
    }

    try {
      const targetInfo = savedInfos.find(info => info.id === itemId);
      if (!targetInfo) {
        toast.error('Bilgi bulunamadı');
        return;
      }

      await saveVote(
        targetInfo.userId,
        itemId,
        auth.currentUser.uid,
        voteType
      );

      toast.success('Oyunuz kaydedildi');
    } catch (error) {
      console.error('Oy verme hatası - Detaylı bilgi:', {
        hata: error,
        hataMetni: error instanceof Error ? error.message : 'Bilinmeyen hata',
        hataTipi: error instanceof Error ? error.name : 'Bilinmeyen tip',
        hedefBilgi: {
          bilgiId: itemId,
          kullaniciId: auth.currentUser?.uid,
          koleksiyon: savedInfos.find(info => info.id === itemId)?.collectionId
        }
      });
      toast.error('Oy kaydedilemedi');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-8 flex justify-center">
        <div className="w-12 h-12 border-t-2 border-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Bilgi Akışı</h1>
          <Link 
            to="/discover"
            className="bg-accent-purple text-white px-4 py-2 rounded-lg hover:bg-accent-purple/90 transition-colors"
          >
            Yeni Bilgi Keşfet
          </Link>
        </div>

        <div className="grid gap-6">
          {savedInfos.map((item) => (
            <div key={item.id} className="bg-zinc-900/50 border border-white/10 rounded-lg overflow-hidden">
              {/* Üst Kısım - Kullanıcı ve Koleksiyon Bilgisi */}
              <div className="px-6 pt-4 pb-2 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Link to={`/profile/${item.userId}`} className="flex items-center gap-2 text-gray-300 hover:text-white">
                      <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center">
                        <FiUser className="w-4 h-4 text-accent-purple" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.userDisplayName || 'İsimsiz Kullanıcı'}</span>
                        <span className="text-xs text-gray-400">{item.userEmail}</span>
                      </div>
                    </Link>
                    <Link to={`/collection/${item.collectionId}`} className="flex items-center gap-2 text-gray-400">
                      <FiFolder className="w-4 h-4" />
                      <span>{item.collectionName}</span>
                    </Link>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    {new Date(item.createdAt.toDate()).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              </div>

              {/* Orta Kısım - Kategoriler ve İçerik */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-sm">
                    {item.category}
                  </span>
                  {item.subCategory && (
                    <span className="px-3 py-1 rounded-full bg-accent-purple/10 text-accent-purple border border-accent-purple/20 text-sm">
                      {item.subCategory}
                    </span>
                  )}
                </div>
                <p className="leading-relaxed text-gray-200">{item.content}</p>
              </div>

              {/* Alt Kısım - Oylar */}
              <div className="px-6 py-3 bg-black/20 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleVote(item.id, 'up')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        item.userVote === 'up'
                          ? 'text-green-500 bg-green-500/10'
                          : 'text-gray-400 hover:text-green-500 hover:bg-white/5'
                      }`}
                      title="Yukarı Oy"
                    >
                      <FiArrowUp className="w-5 h-5" />
                    </button>
                    <span className={`font-medium ${
                      item.voteCount > 0 ? 'text-green-500' : 
                      item.voteCount < 0 ? 'text-red-500' : 
                      'text-gray-400'
                    }`}>
                      {item.voteCount}
                    </span>
                    <button
                      onClick={() => handleVote(item.id, 'down')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        item.userVote === 'down'
                          ? 'text-red-500 bg-red-500/10'
                          : 'text-gray-400 hover:text-red-500 hover:bg-white/5'
                      }`}
                      title="Aşağı Oy"
                    >
                      <FiArrowDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {savedInfos.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>Henüz hiç bilgi paylaşılmamış</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home; 