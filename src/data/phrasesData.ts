export interface Phrase {
  id: number;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  videoUrl: string;
  audioUrl: string;
  duration: number; // seconds
}

export const phrasesData: Phrase[] = [
  {
    id: 1,
    title: "1st Phrase",
    arabic: "اللهُ أَكْبَرُ اللهُ أَكْبَرُ",
    transliteration: "Allahu Akbar Allahu Akbar",
    translation: "Allah is the Greatest, Allah is the Greatest",
    videoUrl: "https://www.youtube.com/embed/RmSveD0Emek",
    audioUrl: "https://firebasestorage.googleapis.com/v0/b/azaan-app-41cac.firebasestorage.app/o/azaans%2Fqari_part_1.mp3?alt=media&token=237d4e6a-c2f9-464a-bf4d-35a2b15283f0",
    duration: 6
  },
  {
    id: 2,
    title: "2nd Phrase",
    arabic: "اللهُ أَكْبَرُ اللهُ أَكْبَرُ",
    transliteration: "Allahu Akbar Allahu Akbar",
    translation: "Allah is the Greatest, Allah is the Greatest",
    videoUrl: "https://www.youtube.com/embed/58fKAl0R74E",
    audioUrl: "https://firebasestorage.googleapis.com/v0/b/azaan-app-41cac.firebasestorage.app/o/azaans%2Fqari_part_2.mp3?alt=media&token=8006118b-7747-44b8-8d0a-59a3abc81495",
    duration: 8
  },
  {
    id: 3,
    title: "3rd Phrase",
    arabic: "أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللهُ",
    transliteration: "Ashhadu an la ilaha illa Allah",
    translation: "I bear witness that there is no deity except Allah",
    videoUrl: "https://www.youtube.com/embed/keg0d_Cl_zc",
    audioUrl: "https://firebasestorage.googleapis.com/v0/b/azaan-app-41cac.firebasestorage.app/o/azaans%2Fqari_part_3.mp3?alt=media&token=b06403ae-f8fb-4059-9467-11b7bc20873b",
    duration: 8
  },
  {
    id: 4,
    title: "4th Phrase",
    arabic: "أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللهُ",
    transliteration: "Ashhadu an la ilaha illa Allah",
    translation: "I bear witness that there is no deity except Allah",
    videoUrl: "https://www.youtube.com/embed/5iG2WUXAi4k",
    audioUrl: "https://firebasestorage.googleapis.com/v0/b/azaan-app-41cac.firebasestorage.app/o/azaans%2Fqari_part_4.mp3?alt=media&token=af326ce2-9a01-4159-8b57-3ad54f6133cb",
    duration: 9
  },
  {
    id: 5,
    title: "5th Phrase",
    arabic: "أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللهِ",
    transliteration: "Ashhadu anna Muhammadan rasul Allah",
    translation: "I bear witness that Muhammad is the Messenger of Allah",
    videoUrl: "https://www.youtube.com/embed/ojdP4iM0k4o",
    audioUrl: "https://firebasestorage.googleapis.com/v0/b/azaan-app-41cac.firebasestorage.app/o/azaans%2Fqari_part_5.mp3?alt=media&token=a6e827d1-bb0a-44a2-be73-150ee16503da",
    duration: 9
  },
  {
    id: 6,
    title: "6th Phrase",
    arabic: "أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللهِ",
    transliteration: "Ashhadu anna Muhammadan rasul Allah",
    translation: "I bear witness that Muhammad is the Messenger of Allah",
    videoUrl: "https://www.youtube.com/embed/9RsUfFzheMQ",
    audioUrl: "https://firebasestorage.googleapis.com/v0/b/azaan-app-41cac.firebasestorage.app/o/azaans%2Fqari_part_6.mp3?alt=media&token=96938e67-4db9-465d-9c57-27ede92b18d8",
    duration: 9
  },
  {
    id: 7,
    title: "7th Phrase",
    arabic: "حَيَّ عَلَى الصَّلَاةِ",
    transliteration: "Hayya 'ala as-salah",
    translation: "Come to prayer",
    videoUrl: "https://www.youtube.com/embed/ubtpZ2CzFws",
    audioUrl: "https://firebasestorage.googleapis.com/v0/b/azaan-app-41cac.firebasestorage.app/o/azaans%2Fqari_part_7.mp3?alt=media&token=05998610-1001-4b04-a2ea-0525191bb8a6",
    duration: 7
  },
  {
    id: 8,
    title: "8th Phrase",
    arabic: "حَيَّ عَلَى الصَّلَاةِ",
    transliteration: "Hayya 'ala as-salah",
    translation: "Come to prayer",
    videoUrl: "https://www.youtube.com/embed/yto2bedxQfM",
    audioUrl: "https://firebasestorage.googleapis.com/v0/b/azaan-app-41cac.firebasestorage.app/o/azaans%2Fqari_part_9.mp3?alt=media&token=dfc8204e-37f0-44e6-90cf-e9420c94809e",
    duration: 7
  },
  {
    id: 9,
    title: "9th Phrase",
    arabic: "حَيَّ عَلَى الْفَلَاحِ",
    transliteration: "Hayya 'ala al-falah",
    translation: "Come to success",
    videoUrl: "https://www.youtube.com/embed/eWD9KM5-n1s",
    audioUrl: "https://firebasestorage.googleapis.com/v0/b/azaan-app-41cac.firebasestorage.app/o/azaans%2Fqari_part_9.mp3?alt=media&token=dfc8204e-37f0-44e6-90cf-e9420c94809e",
    duration: 6
  },
  {
    id: 10,
    title: "10th Phrase",
    arabic: "حَيَّ عَلَى الْفَلَاحِ",
    transliteration: "Hayya 'ala al-falah",
    translation: "Come to success",
    videoUrl: "https://www.youtube.com/embed/UvMlf-1brG0",
    audioUrl: "https://firebasestorage.googleapis.com/v0/b/azaan-app-41cac.firebasestorage.app/o/azaans%2Fqari_part_10.mp3?alt=media&token=c094626c-5e06-4350-911b-8153c2066ff2",
    duration: 7
  },
  {
    id: 11,
    title: "11th Phrase",
    arabic: "الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ",
    transliteration: "As-salātu khayrun minan-nawm",
    translation: "Prayer is better than sleep",
    videoUrl: "https://www.youtube.com/embed/Sw8mEr-Gtg8",
    audioUrl: "https://firebasestorage.googleapis.com/v0/b/azaan-app-41cac.firebasestorage.app/o/azaans%2Fqari_part_11.mp3?alt=media&token=e2659649-3f06-4ac3-96c6-c7adc0d0bb38",
    duration: 11
  },
  {
    id: 12,
    title: "12th Phrase",
    arabic: "الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ",
    transliteration: "As-salātu khayrun minan-nawm",
    translation: "Prayer is better than sleep",
    videoUrl: "https://www.youtube.com/embed/cQymYijmpOs",
    audioUrl: "https://firebasestorage.googleapis.com/v0/b/azaan-app-41cac.firebasestorage.app/o/azaans%2Fqari_part_12.mp3?alt=media&token=c7bf755e-6334-4537-a3bd-add592690bbd",
    duration: 9
  },
  {
    id: 13,
    title: "13th Phrase",
    arabic: "اللهُ أَكْبَرُ اللهُ أَكْبَرُ",
    transliteration: "Allahu Akbar Allahu Akbar",
    translation: "Allah is the Greatest, Allah is the Greatest",
    videoUrl: "https://www.youtube.com/embed/txy9jQmyRgg",
    audioUrl: "https://firebasestorage.googleapis.com/v0/b/azaan-app-41cac.firebasestorage.app/o/azaans%2Fqari_part_13.mp3?alt=media&token=cf3d2a80-1ff8-4aa5-a947-6d980e72837d",
    duration: 8
  },
  {
    id: 14,
    title: "14th Phrase",
    arabic: "لَا إِلَٰهَ إِلَّا اللهُ",
    transliteration: "La ilaha illa Allah",
    translation: "There is no deity except Allah",
    videoUrl: "https://www.youtube.com/embed/NS1EMo-z7JQ",
    audioUrl: "https://firebasestorage.googleapis.com/v0/b/azaan-app-41cac.firebasestorage.app/o/azaans%2Fqari_part_14.mp3?alt=media&token=1b45b68b-50f1-4c79-a13c-64665d64f2ab",
    duration: 9
  }
];