export type Phrase = {
  id: string
  korean: string
  romanization: string
  english: string
}

// Starter deck: greetings and survival phrases for beginners.
export const phrases: Phrase[] = [
  { id: 'hello', korean: '안녕하세요', romanization: 'annyeonghaseyo', english: 'Hello' },
  { id: 'thanks', korean: '감사합니다', romanization: 'gamsahamnida', english: 'Thank you' },
  { id: 'sorry', korean: '죄송합니다', romanization: 'joesonghamnida', english: "I'm sorry" },
  { id: 'okay', korean: '괜찮아요', romanization: 'gwaenchanayo', english: "It's okay" },
  { id: 'nice-to-meet', korean: '만나서 반갑습니다', romanization: 'mannaseo bangapseumnida', english: 'Nice to meet you' },
  { id: 'student', korean: '저는 학생이에요', romanization: 'jeoneun haksaengieyo', english: 'I am a student' },
  { id: 'study-korean', korean: '한국어를 공부해요', romanization: 'hangugeoreul gongbuhaeyo', english: 'I study Korean' },
  { id: 'how-much', korean: '이거 얼마예요', romanization: 'igeo eolmayeyo', english: 'How much is this?' },
  { id: 'restroom', korean: '화장실이 어디예요', romanization: 'hwajangsiri eodiyeyo', english: 'Where is the restroom?' },
  { id: 'water', korean: '물 주세요', romanization: 'mul juseyo', english: 'Water, please' },
  { id: 'delicious', korean: '맛있어요', romanization: 'masisseoyo', english: "It's delicious" },
  { id: 'been-well', korean: '잘 지내셨어요', romanization: 'jal jinaesyeosseoyo', english: 'Have you been well?' },
  { id: 'bye-staying', korean: '안녕히 가세요', romanization: 'annyeonghi gaseyo', english: 'Goodbye (to someone leaving)' },
  { id: 'bye-leaving', korean: '안녕히 계세요', romanization: 'annyeonghi gyeseyo', english: "Goodbye (when you're leaving)" },
  { id: 'slowly', korean: '천천히 말해 주세요', romanization: 'cheoncheonhi malhae juseyo', english: 'Please speak slowly' },
  { id: 'again', korean: '다시 한번 말해 주세요', romanization: 'dasi hanbeon malhae juseyo', english: 'Please say it again' },
  { id: 'understood', korean: '이해했어요', romanization: 'ihaehaesseoyo', english: 'I understood' },
  { id: 'not-sure', korean: '잘 모르겠어요', romanization: 'jal moreugesseoyo', english: "I'm not sure" },
  { id: 'help', korean: '도와주세요', romanization: 'dowajuseyo', english: 'Please help me' },
  { id: 'english', korean: '영어 할 수 있어요', romanization: 'yeongeo hal su isseoyo', english: 'Can you speak English?' },
]
