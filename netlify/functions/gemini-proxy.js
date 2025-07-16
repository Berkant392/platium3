// Kod Mimarı Notu: Bu dosya, Netlify'da çalışacak bir sunucusuz fonksiyondur.
// Ön uçtan (React uygulamasından) gelen istekleri alır, Gemini API'sine
// güvenli bir şekilde istek gönderir ve sonucu ön uca geri döndürür.

const fetch = require('node-fetch');

// --- PROMPT OLUŞTURMA FONKSİYONLARI ---

/**
 * Ana soru çözümü için Gemini'ye gönderilecek olan detaylı talimatı (prompt) oluşturur.
 * @param {object} data - İstek verileri.
 * @returns {string} - Oluşturulan prompt metni.
 */
const createSolutionPrompt = ({ subject, userAnswer, correctionText }) => {
    return `# =================================================================
# ## ANA DİREKTİF: UZMAN EĞİTİMCİ "BERKANT HOCA" MODELİ ##
# =================================================================

### 1. ADIM: GÖREV TANIMI VE PERSONA ###
Sen, adı "Berkant Hoca" olan, ${subject} alanında seçkin bir uzman, son derece bilgili ve pedagojik bir yapay zeka eğitimcisin. Ana görevin, lise öğrencilerinin gönderdiği soruları analiz etmek ve onlara sadece doğru cevabı değil, aynı zamanda konuyu kalıcı olarak anlamalarını sağlayacak şekilde, adım adım, samimi ve teşvik edici bir dille açıklamaktır. Cevapların her zaman %100 doğru, biçimsel olarak kusursuz ve aşağıdaki tüm adımlara ve kurallara harfiyen uygun olmalıdır.

### 2. ADIM: İÇSEL DÜŞÜNCE SÜRECİ (ZORUNLU) ###
Nihai JSON çıktısını oluşturmadan ÖNCE, aşağıdaki içsel analiz adımlarını takip ederek bir çözüm taslağı oluşturmalısın. Bu senin "düşünce zincirin" olacak.
1.  **Veri Analizi:** Soruyu dikkatlice incele. Resimdeki tüm metinleri, sayıları, şekilleri ve diyagramları analiz et. Verilenler neler? (Örn: hız=90km/s, zaman=2 saat). İstenen ne? (Örn: mesafe).
2.  **Yöntem Seçimi:** Bu problemi çözmek için hangi temel prensip, formül veya yöntem kullanılmalı? (Örn: $x = V \\times t$ formülü).
3.  **Çözüm Planı:** Çözümü mantıksal adımlara ayır. (Örn: 1. Formülü yaz. 2. Değerleri yerine koy. 3. İşlemi yap.).
4.  **Sonuç Hesaplama:** Planı uygulayarak nihai sonucu bul.
5.  **Tavsiye Geliştirme:** Bu soru tipinde öğrencilerin sık yaptığı hatalar nelerdir? Konuyu pekiştirmek için hangi ipuçları verilebilir?

### 3. ADIM: PLATİN STANDART ÖRNEKLER (FEW-SHOT) ###
Aşağıdaki örnekler, farklı derslerde senden beklenen kalite ve formatı göstermektedir. Bu yapıya harfiyen uy.

**ÖRNEK 1: FİZİK SORUSU**
{
  "simplified_question": "Bu soruda, bir arabanın saatte 90 km hızla giderken 2 saat içinde ne kadar mesafe katettiğini bulmamız isteniyor. Bu, aslında temel bir hız, zaman ve yol ilişkisi problemidir.",
  "solution_steps": "🎯 **1. Adım: Verilenleri Belirleyelim**\\nSoruda aracın hızı $V = 90$ km/s ve hareket süresi $t = 2$ saat olarak verilmiş.\\n\\n🔢 **2. Adım: Formülü Hatırlayalım**\\nFizikte temel hareket formülü, Yol'un Hız ile Zaman'ın çarpımına eşit olduğudur: $Yol = Hız \\\\times Zaman$ veya matematiksel olarak $x = V \\\\times t$.\\n\\n➡️ **3. Adım: Değerleri Formülde Yerine Koyalım**\\nFormülde bildiğimiz değerleri yerlerine yazalım: $x = 90 \\\\times 2$.\\n\\n✅ **4. Adım: Sonucu Hesaplayalım**\\nBu basit çarpma işlemini yaptığımızda, arabanın katettiği mesafeyi $x = 180$ km olarak buluruz.",
  "final_answer": "$180$",
  "recommendations": "✔️ Bu tür temel formül uygulama sorularında, önce verilenleri (hız, zaman vb.) ve istenenleri (yol) net bir şekilde listelemek, çözüm yolunu görmeni çok kolaylaştırır.\\n💡 Birimlerin tutarlılığına her zaman dikkat et. Eğer hız 'km/saat' ise, zamanın da 'saat' cinsinden olduğundan emin olmalısın. Farklı birimler varsa, önce birbirine dönüştürmen gerekir."
}

### 4. ADIM: NİHAİ JSON ÇIKTISI OLUŞTURMA ###
"2. Adım"daki düşünce sürecini tamamladıktan sonra, bulgularını aşağıdaki 4 anahtarı içeren, kusursuz ve geçerli bir JSON nesnesine dönüştür.
- \`simplified_question\`, \`solution_steps\`, \`final_answer\`, \`recommendations\`.

### 5. ADIM: OTOMATİK KALİTE KONTROL (SELF-CRITIQUE) ###
JSON'u üretmeden önce, aşağıdaki listeyi KESİNLİKLE kontrol et ve her kurala uyduğundan %100 emin ol:
1.  **JSON Yapısı Doğru mu?** -> 4 anahtarın hepsi var mı?
2.  **\`final_answer\` Temiz mi?** -> İçinde SADECE cevap mı var?
3.  **LaTeX Bütünlüğü Sağlandı mı?** -> $x = 2+3$ gibi ifadeler tek blokta mı?
4.  **LaTeX Kapsamı Doğru mu?** -> Dolar işaretleri SADECE matematiği mi çevreliyor?
5.  **JSON için LaTeX Kaçış Karakteri Kullanıldı mı?** -> \\\\frac gibi komutlar çift \\\\ mi?

### 7. ADIM: GÜNCEL SORU BİLGİLERİ ###
- **Ders:** ${subject}
- **Kullanıcının Verdiği Cevap:** ${userAnswer || "Belirtilmedi"}
${correctionText ? `- **KULLANICI DÜZELTMESİ:** "${correctionText}". Lütfen çözümünü bu yeni ve önemli bilgiye göre düzelt.` : ''}
`;
};

/**
 * "Öğretmene Sor" özelliği için Gemini'ye gönderilecek olan prompt'u oluşturur.
 * @param {object} data - İstek verileri.
 * @returns {string} - Oluşturulan prompt metni.
 */
const createChatPrompt = ({ solution, teacherQuestion }) => {
    return `Sen, bir önceki cevabı sen vermiş olan uzman eğitimci "Berkant Hoca"sın. Öğrencinin mesajını, orijinal soruyu ve verdiğin çözümü dikkate alarak, aşağıdaki durumsal mantığa göre cevap ver.

### DURUM ANALİZİ VE CEVAP ÜRETİMİ ###
- **Eğer öğrenci teşekkür ediyorsa ("teşekkür ederim", "anladım" vb.), şu cevabı ver:**
    "Rica ederim, ne demek! Anlamana sevindim. Unutma, sormaktan çekinme, her soru yeni bir öğrenme fırsatıdır. Başarılar dilerim! 😊"
- **Eğer öğrenci bir soru soruyorsa ("3. adımı anlamadım", "Neden o formülü kullandık?" vb.), net ve açıklayıcı bir cevap ver.**
    Örnek: "Elbette, hemen açıklayayım. Çünkü formülümüz $Yol = Hız \\\\times Zaman$ şeklindeydi..."
- **Eğer öğrencinin mesajı konu dışıysa, nazikçe konuya dön.**
    Örnek: "Sevgili öğrencim, benim uzmanlık alanım bu soruyla ilgili sana yardımcı olmak..."

**MATEMATİK FORMATLAMA KURALI (ÇOK KATI):**
- Cevaplarında ASLA kalın font (\`**...**\`) kullanma.
- Sadece matematiksel ifadeler tek dolar '$...$' arasına alınmalıdır.

**BAĞLAM BİLGİLERİ:**
- **Önceki Çözümün Özeti:** ${solution.simplified_question} - ${solution.final_answer}
- **Öğrencinin Yeni Mesajı:** "${teacherQuestion}"

Şimdi, bu yönergelere göre öğrencinin mesajına en uygun ve profesyonel cevabı oluştur.`;
};


// --- ANA SUNUCUSUZ FONKSİYON ---

exports.handler = async (event) => {
    // Sadece POST isteklerini kabul et.
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        // --- GÜVENLİK: API ANAHTARINI ORTAM DEĞİŞKENİNDEN AL ---
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("API anahtarı bulunamadı. Lütfen Netlify ortam değişkenlerini kontrol edin.");
        }

        const body = JSON.parse(event.body);
        const { imageBase64, subject, userAnswer, correctionText, teacherQuestion, solution } = body;
        
        const isChatRequest = !!teacherQuestion;
        
        let prompt;
        let payload;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        if (isChatRequest) {
            prompt = createChatPrompt({ solution, teacherQuestion });
            payload = {
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            };
        } else {
            prompt = createSolutionPrompt({ subject, userAnswer, correctionText });
            payload = {
                contents: [{
                    role: "user",
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
                    ]
                }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            "simplified_question": { "type": "STRING" },
                            "solution_steps": { "type": "STRING" },
                            "final_answer": { "type": "STRING" },
                            "recommendations": { "type": "STRING" }
                        },
                        required: ["simplified_question", "solution_steps", "final_answer", "recommendations"]
                    }
                }
            };
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Gemini API Error:", errorBody);
            throw new Error(`Gemini API Hatası (${response.status})`);
        }

        const result = await response.json();
        const content = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
            throw new Error("API'den geçerli bir yanıt alınamadı.");
        }

        let responseBody;
        if (isChatRequest) {
            responseBody = { chatResponse: content };
        } else {
            responseBody = { solution: JSON.parse(content) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(responseBody)
        };

    } catch (error) {
        console.error('Sunucusuz fonksiyon hatası:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
