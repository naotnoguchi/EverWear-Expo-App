// Mock data for development
import { AppClothingItem, Brand } from '../types/database';

// Mock user ID
export const MOCK_USER_ID = 'mock-user-id';

// Mock clothing items
export const mockClothingItems: AppClothingItem[] = [
  {
    id: "1",
    name: "お気に入りの白シャツ",
    category: "トップス",
    brand: "Gucci",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=776&q=80",
    wearCount: 4,
    washThreshold: 3,
    lastWorn: "2025-05-20",
    wearHistory: [
      "2025-01-05", "2025-01-15", "2025-01-25",
      "2025-02-10", "2025-02-20",
      "2025-03-05", "2025-03-15", "2025-03-25",
      "2025-04-10", "2025-04-20",
      "2025-05-05", "2025-05-20"
    ],
    washHistory: [
      "2025-01-10", "2025-01-30",
      "2025-02-25",
      "2025-03-30",
      "2025-05-10"
    ],
  },
  {
    id: "2",
    name: "黒パンツ",
    category: "ボトムス",
    brand: "Prada",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=387&q=80",
    wearCount: 3,
    washThreshold: 3,
    lastWorn: "2025-05-15",
    wearHistory: [
      "2025-01-08", "2025-01-18", "2025-01-28",
      "2025-02-08", "2025-02-18", "2025-02-28",
      "2025-03-10", "2025-03-20",
      "2025-04-05", "2025-04-15", "2025-04-25",
      "2025-05-05", "2025-05-15"
    ],
    washHistory: [
      "2025-01-20",
      "2025-02-20",
      "2025-03-25",
      "2025-04-30"
    ],
  },
  {
    id: "3",
    name: "デニムジャケット",
    category: "アウター",
    brand: "Burberry",
    image: "https://images.unsplash.com/photo-1548126032-079a0fb0099d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=387&q=80",
    wearCount: 2,
    washThreshold: 5,
    lastWorn: "2025-05-18",
    wearHistory: [
      "2025-01-12", "2025-01-22",
      "2025-02-05", "2025-02-15", "2025-02-25",
      "2025-03-08", "2025-03-18", "2025-03-28",
      "2025-04-08", "2025-04-18", "2025-04-28",
      "2025-05-08", "2025-05-18"
    ],
    washHistory: [
      "2025-02-10",
      "2025-04-10"
    ],
  },
  {
    id: "4",
    name: "グレーのセーター",
    category: "トップス",
    brand: "Dior",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
    wearCount: 2,
    washThreshold: 4,
    lastWorn: "2025-05-12",
    wearHistory: [
      "2025-01-03", "2025-01-13", "2025-01-23",
      "2025-02-03", "2025-02-13", "2025-02-23",
      "2025-03-03", "2025-03-13", "2025-03-23",
      "2025-04-03", "2025-04-13", "2025-04-23",
      "2025-05-02", "2025-05-12"
    ],
    washHistory: [
      "2025-01-15",
      "2025-02-15",
      "2025-03-15",
      "2025-04-15"
    ],
  },
  {
    id: "5",
    name: "チノパン",
    category: "ボトムス",
    brand: "Louis Vuitton",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=397&q=80",
    wearCount: 3,
    washThreshold: 4,
    lastWorn: "2025-05-22",
    wearHistory: [
      "2025-01-07", "2025-01-17", "2025-01-27",
      "2025-02-07", "2025-02-17", "2025-02-27",
      "2025-03-07", "2025-03-17", "2025-03-27",
      "2025-04-07", "2025-04-17", "2025-04-27",
      "2025-05-07", "2025-05-17", "2025-05-22"
    ],
    washHistory: [
      "2025-01-25",
      "2025-03-01",
      "2025-04-05",
      "2025-05-10"
    ],
  },
  {
    id: "6",
    name: "レザースニーカー",
    category: "シューズ",
    brand: "Balenciaga",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1112&q=80",
    wearCount: 2,
    washThreshold: 10,
    lastWorn: "2025-05-19",
    wearHistory: [
      "2025-01-10", "2025-01-20", "2025-01-30",
      "2025-02-09", "2025-02-19",
      "2025-03-01", "2025-03-11", "2025-03-21",
      "2025-04-01", "2025-04-11", "2025-04-21",
      "2025-05-01", "2025-05-11", "2025-05-19"
    ],
    washHistory: [
      "2025-02-01",
      "2025-04-15"
    ],
  },
  {
    id: "7",
    name: "カシミアマフラー",
    category: "アクセサリー",
    brand: "Hermès",
    image: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
    wearCount: 1,
    washThreshold: 5,
    lastWorn: "2025-05-16",
    wearHistory: [
      "2025-01-02", "2025-01-12", "2025-01-22",
      "2025-02-01", "2025-02-11", "2025-02-21",
      "2025-03-03", "2025-03-13", "2025-03-23",
      "2025-04-02", "2025-04-12", "2025-04-22",
      "2025-05-02", "2025-05-12", "2025-05-16"
    ],
    washHistory: [
      "2025-01-25",
      "2025-03-05",
      "2025-05-05"
    ],
  },
  {
    id: "8",
    name: "ウールコート",
    category: "アウター",
    brand: "Chanel",
    image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
    wearCount: 3,
    washThreshold: 6,
    lastWorn: "2025-05-21",
    wearHistory: [
      "2025-01-05", "2025-01-15", "2025-01-25",
      "2025-02-04", "2025-02-14", "2025-02-24",
      "2025-03-06", "2025-03-16", "2025-03-26",
      "2025-04-05", "2025-04-15", "2025-04-25",
      "2025-05-05", "2025-05-15", "2025-05-21"
    ],
    washHistory: [
      "2025-02-01",
      "2025-04-01"
    ],
  },
  {
    id: "9",
    name: "シルクネクタイ",
    category: "アクセサリー",
    brand: "Versace",
    image: "https://images.unsplash.com/photo-1589756823695-278bc923f962?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=735&q=80",
    wearCount: 2,
    washThreshold: 5,
    lastWorn: "2025-05-23",
    wearHistory: [
      "2025-01-08", "2025-01-18", "2025-01-28",
      "2025-02-07", "2025-02-17", "2025-02-27",
      "2025-03-09", "2025-03-19", "2025-03-29",
      "2025-04-08", "2025-04-18", "2025-04-28",
      "2025-05-08", "2025-05-18", "2025-05-23"
    ],
    washHistory: [
      "2025-01-30",
      "2025-03-30",
      "2025-05-15"
    ],
  },
  {
    id: "10",
    name: "レザーブーツ",
    category: "シューズ",
    brand: "Saint Laurent",
    image: "https://images.unsplash.com/photo-1605812860427-4024433a70fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=735&q=80",
    wearCount: 4,
    washThreshold: 8,
    lastWorn: "2025-05-25",
    wearHistory: [
      "2025-01-03", "2025-01-13", "2025-01-23",
      "2025-02-02", "2025-02-12", "2025-02-22",
      "2025-03-04", "2025-03-14", "2025-03-24",
      "2025-04-03", "2025-04-13", "2025-04-23",
      "2025-05-03", "2025-05-13", "2025-05-25"
    ],
    washHistory: [
      "2025-02-05",
      "2025-04-05"
    ],
  },
];

// Mock brands
export const mockBrands: string[] = [
  // ハイブランド
  "Gucci", "Prada", "Louis Vuitton", "Dior", "Chanel", "Hermès", "Burberry", 
  "Balenciaga", "Saint Laurent", "Versace", "Fendi", "Givenchy", "Valentino",
  "Bottega Veneta", "Celine", "Alexander McQueen", "Loewe", "Miu Miu", "Tom Ford",
  "Balmain", "Dolce & Gabbana", "Armani", "Salvatore Ferragamo", "Cartier", "Rolex",
  "Tiffany & Co.", "Bulgari", "Montblanc", "Brunello Cucinelli", "Max Mara",

  // 一般ブランド
  "ユニクロ", "GU", "無印良品", "H&M", "ZARA", "GAP", "BEAMS", 
  "ナイキ", "アディダス", "プーマ", "リーバイス", "ラコステ", "ポロ・ラルフローレン"
];

// Helper function to simulate network delay
export const simulateNetworkDelay = async (ms: number = 300): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
