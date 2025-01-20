import OpenAI from 'openai';
import { 
  FiCode, FiCpu, FiBook, FiMusic, FiGlobe, 
  FiFeather, FiAperture, FiMap, FiCamera, FiZap,
  FiHeart, FiDatabase, FiTrendingUp
} from 'react-icons/fi';

export interface CategoryInfo {
  id: string;
  name: string;
  icon: any; // React icon component
  description: string;
}

export const categories: CategoryInfo[] = [
  {
    id: 'software',
    name: 'Yazılım',
    icon: FiCode,
    description: 'Programlama, web geliştirme ve yazılım teknolojileri'
  },
  {
    id: 'technology',
    name: 'Teknoloji',
    icon: FiCpu,
    description: 'Yeni teknolojiler ve dijital yenilikler'
  },
  {
    id: 'science',
    name: 'Bilim',
    icon: FiZap,
    description: 'Bilimsel keşifler ve araştırmalar'
  },
  {
    id: 'art',
    name: 'Sanat',
    icon: FiFeather,
    description: 'Görsel sanatlar, müzik ve yaratıcılık'
  },
  {
    id: 'history',
    name: 'Tarih',
    icon: FiBook,
    description: 'Dünya tarihi ve önemli olaylar'
  },
  {
    id: 'philosophy',
    name: 'Felsefe',
    icon: FiAperture,
    description: 'Düşünce sistemleri ve felsefi akımlar'
  },
  {
    id: 'psychology',
    name: 'Psikoloji',
    icon: FiHeart,
    description: 'İnsan davranışları ve zihin bilimi'
  },
  {
    id: 'geography',
    name: 'Coğrafya',
    icon: FiMap,
    description: 'Dünya coğrafyası ve kültürler'
  },
  {
    id: 'photography',
    name: 'Fotoğrafçılık',
    icon: FiCamera,
    description: 'Fotoğraf sanatı ve teknikleri'
  },
  {
    id: 'data_science',
    name: 'Veri Bilimi',
    icon: FiDatabase,
    description: 'Veri analizi ve yapay zeka'
  },
  {
    id: 'business',
    name: 'İş Dünyası',
    icon: FiTrendingUp,
    description: 'Girişimcilik ve iş stratejileri'
  },
  {
    id: 'culture',
    name: 'Kültür',
    icon: FiGlobe,
    description: 'Dünya kültürleri ve gelenekler'
  }
] as const;

export type Category = typeof categories[number]['id'];

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const getAnswer = async (question: string): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Sen yardımcı bir AI asistanısın. Sorulara net, anlaşılır ve bilgilendirici yanıtlar vermelisin."
        },
        {
          role: "user",
          content: question
        }
      ],
      model: "gpt-3.5-turbo",
    });

    return completion.choices[0]?.message?.content || 'Üzgünüm, yanıt üretilemedi.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Yanıt alınırken bir hata oluştu.');
  }
};

export const generateSubCategories = async (category: Category): Promise<{ name: string; description: string }[]> => {
  const categoryInfo = categories.find(c => c.id === category);
  if (!categoryInfo) throw new Error('Kategori bulunamadı');

  const prompt = `"${categoryInfo.name}" kategorisi için 15 tane alt kategori oluştur. Her alt kategori için bir isim ve kısa açıklama ver. Alt kategoriler spesifik ve ilgi çekici olmalı. Yanıt JSON formatında olmalı: {"subcategories": [{"name": "Alt Kategori Adı", "description": "Açıklama"}]}. Yanıtı Türkçe olarak ver.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Sen bir kategori uzmanısın. Verilen ana kategori için detaylı ve ilgi çekici alt kategoriler oluşturuyorsun."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    if (!response.choices[0].message.content) {
      throw new Error('AI yanıtı boş');
    }

    const result = JSON.parse(response.choices[0].message.content);
    return result.subcategories;
  } catch (error) {
    console.error('Alt kategoriler oluşturulurken hata:', error);
    throw error;
  }
};

export const getRandomInfo = async (category: Category, subCategory?: string): Promise<string> => {
  try {
    console.log('getRandomInfo başlatıldı:', { category, subCategory });

    const categoryInfo = categories.find(c => c.id === category);
    if (!categoryInfo) {
      throw new Error(`Kategori bulunamadı: ${category}`);
    }

    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI API anahtarı bulunamadı');
    }

    const prompt = `${categoryInfo.name} ${subCategory ? `ve özellikle ${subCategory} konusunda` : 'konusunda'} ilginç ve öğretici bir bilgi ver. Bilgi kısa ve öz olmalı, en fazla 2-3 cümle olmalı. Yanıtı Türkçe olarak ver.`;

    console.log('OpenAI isteği hazırlandı:', {
      model: "gpt-4",
      prompt: prompt,
      apiKeyLength: import.meta.env.VITE_OPENAI_API_KEY.length
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Sen bir bilgi uzmanısın. İlginç, öğretici ve doğrulanmış bilgiler veriyorsun. Her zaman güvenilir ve net bilgiler sunuyorsun."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    const content = response.choices[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error('OpenAI yanıtı boş geldi');
    }

    return content;

  } catch (err: any) {
    console.error('OpenAI hatası:', {
      errorType: err?.constructor?.name,
      errorMessage: err?.message,
      errorStack: err?.stack,
      category,
      subCategory
    });

    if (err?.message?.includes('API anahtarı')) {
      throw new Error('API anahtarı hatası: Lütfen OpenAI API anahtarınızı kontrol edin');
    }

    if (err?.message?.includes('429')) {
      throw new Error('API limit aşımı: Lütfen daha sonra tekrar deneyin');
    }

    if (err?.message?.includes('401')) {
      throw new Error('API yetkilendirme hatası: API anahtarınızı kontrol edin');
    }

    throw new Error(`OpenAI hatası: ${err?.message}`);
  }
}; 