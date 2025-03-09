declare module 'pinyin' {
  interface PinyinOptions {
    style?: number;
    heteronym?: boolean;
    segment?: boolean;
  }

  const STYLE_NORMAL: number;
  const STYLE_TONE: number;
  const STYLE_TONE2: number;
  const STYLE_TO3NE: number;
  const STYLE_INITIALS: number;
  const STYLE_FIRST_LETTER: number;

  function pinyin(words: string, options?: PinyinOptions): string[][];

  pinyin.STYLE_NORMAL = STYLE_NORMAL;
  pinyin.STYLE_TONE = STYLE_TONE;
  pinyin.STYLE_TONE2 = STYLE_TONE2;
  pinyin.STYLE_TO3NE = STYLE_TO3NE;
  pinyin.STYLE_INITIALS = STYLE_INITIALS;
  pinyin.STYLE_FIRST_LETTER = STYLE_FIRST_LETTER;

  export = pinyin;
} 