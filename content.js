/* Conversation content: intents (how customers ask) and replies in English, Hinglish (hi) and Banglish (bn).
   kw = keywords/phrases separated by |  (English, Roman Hindi, Roman Bengali, Devanagari, Bangla script all mixed)
   r  = replies per language: array of chat bubbles
   next = follow-up chip ids   short = only match short messages (<=4 words)   act = special action */
window.INTENTS=[];
const T=(id,kw,en,hi,bn,o={})=>INTENTS.push({id,kw:kw.toLowerCase().split('|').map(s=>s.trim()).filter(Boolean),r:{en,hi,bn},...o});

/* ---------- small talk and reactions ---------- */
T('greet','hi|hello|hey|hii|hiii|helo|good morning|good evening|namaste|namaskar|nomoskar|nomoshkar|pranam|salaam|hola|kemon acho|kemon achen|kaise ho|kya haal|नमस्ते|नमस्कार|হ্যালো|নমস্কার|হাই',
 ["Hi! 👋 Welcome. I'm the GoDooars trip assistant.","Planning a trip to the Dooars? Ask me anything, or tap an option below."],
 ["Namaste! 👋 Main GoDooars trip assistant hoon.","Dooars ghoomne ka plan hai? Kuch bhi poochiye, ya neeche se chuniye."],
 ["Nomoskar! 👋 Ami GoDooars trip assistant.","Dooars ghurte jaite chan? Jekono proshno korun, ba niche theke bachun."],
 {short:true,next:['plan','besttime','reach','price']});
T('thanks','thanks|thank you|thankyou|thx|tysm|shukriya|dhanyavaad|dhanyabad|dhonnobad|dhonyobad|bohot accha|bahut accha|great help|helpful|धन्यवाद|शुक्रिया|ধন্যবাদ|ধন্যবাদ',
 ["You're welcome! 😊 Anything else you'd like to know?"],["Koi baat nahi! 😊 Aur kuch poochna ho to bataiye."],["Kono byapar na! 😊 Aro kichu jante chaile bolun."],{short:true,next:['plan','price','human']});
T('bye','bye|goodbye|see you|tata|alvida|phir milenge|abar dekha hobe|ta ta|বিদায়|अलविदा',
 ["Happy to help anytime. Have a lovely day! 🌿"],["Jab chahein poochh lijiye. Shubh yatra! 🌿"],["Jokhon iccha bolben. Shubho jatra! 🌿"],{short:true});
T('wow','wow|nice|great|awesome|superb|amazing|lovely|sounds good|sounds great|perfect|bahut badhiya|badhiya|mast|zabardast|ekdom bhalo|darun|khub bhalo|chomotkar|shundor|sundor|वाह|बढ़िया|शानदार|দারুণ|চমৎকার',
 ["Glad you like it! 😊 Want me to put a plan together for you?"],["Mujhe khushi hui! 😊 Chahein to main aapke liye plan bana doon?"],["Shune bhalo laglo! 😊 Chaile ami apnar jonno ekta plan bani?"],{short:true,next:['plan','price']});
T('ok','ok|okay|k|fine|alright|hmm|hmmm|accha|achha|theek hai|thik hai|thik ache|thik achhe|bujhlam|samajh gaya|got it|ठीक है|अच्छा|ঠিক আছে|আচ্ছা',
 ["👍 Anything else I can help with?"],["👍 Aur kuch madad chahiye?"],["👍 Aro kichu lagbe?"],{short:true,next:['plan','price','human']});
T('confused','i dont understand|i don\'t understand|not clear|what do you mean|samajh nahi aaya|samajh nahi|matlab kya|bujhte parlam na|bujhlam na|bujhini|ki bolchen|मतलब क्या|समझ नहीं|বুঝলাম না|বুঝিনি',
 ["Sorry, let me say it simpler 🙏","You can ask things like *best time*, *cost*, *how to reach*, or say *plan 3 days*."],
 ["Maaf kijiye, main simple tarah se bata deta hoon 🙏","Aap aise pooch sakte hain: *kab jaana best hai*, *kitna kharcha*, *kaise pahunchein*, ya *3 din ka plan*."],
 ["Dukkhito, ami sohoj kore boli 🙏","Apni evabe jigges korte paren: *kokhon jabo*, *koto khoroch*, *kibhabe jabo*, ba *3 diner plan*."],{next:['plan','besttime','price','human']});
T('identity','are you a bot|are you human|are you real|who are you|are you ai|you a robot|tum kaun ho|aap kaun hain|bot ho|robot ho|ai ho|tumi ke|apni ke|tumi ki bot|bot naki|तुम कौन|आप कौन|তুমি কে|আপনি কে',
 ["I'm a virtual assistant for Dooars trips 🙂 I can answer most questions and plan a trip. For bookings and exact prices, a real planner takes over."],
 ["Main Dooars trips ka virtual assistant hoon 🙂 Zyadatar sawaalon ke jawab aur trip plan de sakta hoon. Booking aur exact price ke liye hamari team sambhalti hai."],
 ["Ami Dooars trip-er ekta virtual assistant 🙂 Beshirbhag proshner uttor ar trip plan dite pari. Booking ar exact dam-er jonno amader team dekhe."],{next:['plan','human']});

/* ---------- when / how ---------- */
T('besttime','kon mas bhalo|kon mase|kon mas|mas bhalo|konmash|bhalo mash|best time|right time|good time|which month|what month|when to go|when should|when is good|when is best|season|peak season|off season|kab jana|kab jaana|kab jaye|kab jayen|kab chalein|kaun sa mahina|kis mahine|sabse accha samay|best season|kokhon jabo|kobe jabo|kon mashe|kon mash|bhalo somoy|sobcheye bhalo somoy|kon somoy|সেরা সময়|কখন যাব|কোন মাসে|কবে যাব|सबसे अच्छा समय|कब जाएं|कब जाना|कौन सा महीना',
 ["October to March is the best time. It's cool and dry, and safaris are at their best 🌤️","April is still fine, and good for birds. June to mid-September is the rainy season when the main parks stay closed, though the tea gardens and villages look lovely and green."],
 ["Sabse accha samay October se March hai. Mausam thanda aur sukha rehta hai aur safari ke liye best hota hai 🌤️","April bhi theek hai, birds ke liye achha. June se mid-September barish ka season hai jab bade parks band rehte hain, lekin chai bagan aur gaon hare-bhare lagte hain."],
 ["Sobcheye bhalo somoy October theke March. Aabohaowa thanda ar shukno, safari-r jonno ekdom perfect 🌤️","April-o cholbe, birds dekhar jonno bhalo. June theke mid-September borsha, tokhon boro park gulo bondho thake, tobe chaa-bagan ar gram sobuj ar sundor lage."],
 {next:['plan','monsoon','price'],ctx:'season'});
T('monsoon','monsoon|rainy|rain|raining|barish|baarish|barsat|borsha|brishti|bristi|is it open|park open|parks open|park closed|park band|park bondho|closed in|open in|band rehta|bondho thake|বর্ষা|বৃষ্টি|বন্ধ|बारिश|बरसात|मानसून|बंद',
 ["Gorumara and Jaldapara are usually closed from about 16 June to 15 September for the monsoon.","Tea gardens, rivers and village stays stay open, so I can plan a green, peaceful trip around it. Exact dates can change, so I'd confirm before you book."],
 ["Gorumara aur Jaldapara aam taur par 16 June se 15 September tak monsoon mein band rehte hain.","Chai bagan, nadi aur gaon ke stays khule rehte hain, to main us hisaab se hara-bhara, shaant plan bana sakta hoon. Exact dates badal sakti hain, isliye booking se pehle confirm kar lena achha rahega."],
 ["Gorumara ar Jaldapara sadharonoto 16 June theke 15 September porjonto monsoon-e bondho thake.","Chaa-bagan, nodi ar gram-er stay khola thake, tai ami sobuj, shanto ekta plan banate pari. Exact tarikh bodlate pare, tai booking-er age confirm kore nite bolbo."],
 {next:['plan','besttime','stay']});
T('reach','kaise pahunchein|kaise pahunche|pahunchein|pahuchein|pahunche|how to reach|how do i reach|how to get|how to come|reach there|getting there|nearest airport|nearest station|nearest railway|which station|which airport|train|flight|by road|by air|by train|kaise pahunch|kaise jaye|kaise jayen|kaise jana|kaise jaana|kaise aaye|station kaun|airport kaun|kibhabe jabo|kibhabe jete|kemon kore jabo|kothay namte|kon station|kon airport|কীভাবে যাব|কিভাবে যাব|स्टेशन|कैसे पहुंचे|कैसे पहुँचें|कैसे जाएं',
 ["The easiest way is to fly or take a train to *Bagdogra airport* or *New Jalpaiguri (NJP)*, then 2 to 3 hours by road into the Dooars.","If you're heading to Jaldapara or Buxa, Alipurduar and Hasimara stations are closer. Where will you be travelling from?"],
 ["Sabse aasaan hai Bagdogra airport ya New Jalpaiguri (NJP) tak flight ya train lena, phir Dooars tak 2 se 3 ghante road se.","Jaldapara ya Buxa jaana ho to Alipurduar aur Hasimara station zyada paas hain. Aap kahan se aa rahe hain?"],
 ["Sobcheye sohoj Bagdogra airport ba New Jalpaiguri (NJP) porjonto flight ba train, tarpor Dooars-e 2 theke 3 ghonta gari.","Jaldapara ba Buxa jete gele Alipurduar ar Hasimara station kache. Apni kothay theke jachchen?"],
 {next:['kolkata','plan','price']});
T('kolkata','kolkata se kaise|kolkata theke kibhabe|kolkata to dooars|kolkata se dooars|kolkata theke dooars|kolkata se train|from kolkata|kolkata to|kolkata se|kolkata theke|howrah|sealdah|from delhi|from mumbai|from bangalore|from bengaluru|from chennai|delhi se|mumbai se|दिल्ली से|कोलकाता से|কলকাতা থেকে|দিল্লি থেকে|কলকাতা',
 ["From Kolkata you have good options: the overnight *Kanchan Kanya Express* from Sealdah to Alipurduar (about 16 hours), or a train to NJP (Vande Bharat is around 7.5 hours) and then a car.","Flying to Bagdogra is quicker if you're short on time. Train timings change, so check the latest when you book. Want me to plan the trip?"],
 ["Kolkata se achhe options hain: Sealdah se Alipurduar ki raat wali *Kanchan Kanya Express* (lagbhag 16 ghante), ya NJP tak train (Vande Bharat lagbhag 7.5 ghante) phir car.","Samay kam ho to Bagdogra ki flight tez rehti hai. Train timing badalti rehti hai, booking ke time latest dekh lein. Trip plan bana doon?"],
 ["Kolkata theke bhalo option ache: Sealdah theke Alipurduar-er raater *Kanchan Kanya Express* (proay 16 ghonta), ba NJP porjonto train (Vande Bharat proay 7.5 ghonta) tarpor gari.","Somoy kom hole Bagdogra-r flight druto. Train-er somoy bodlay, booking-er somoy latest dekhe nin. Trip-er plan banai?"],
 {next:['plan','price','safari']});
T('days','how many days|how long|how much time|kitne din|kitne dino|kitne din ka|kitna time|koyta din|koto din|koto diner|koto dinr|kotodin|कितने दिन|कितने दिनों|কত দিন|কয়দিন|2 days enough|3 days enough|enough days',
 ["3 nights / 4 days is ideal for the Dooars. 2 days feels rushed because of the drive from Bagdogra or NJP.","With 5 days or more you can add Buxa and the Bhutan border. Shall I plan it for you?"],
 ["Dooars ke liye 3 raat / 4 din sabse achha hai. 2 din mein jaldi lagti hai kyunki Bagdogra ya NJP se drive hai.","5 din ya zyada ho to Buxa aur Bhutan border bhi add kar sakte hain. Plan bana doon?"],
 ["Dooars-er jonno 3 raat / 4 din ekdom thik. 2 din-e tara-hudo lage, karon Bagdogra ba NJP theke gari-r poth.","5 din ba beshi hole Buxa ar Bhutan border-o jora jay. Plan banai?"],
 {next:['plan','price']});

/* ---------- places and activities ---------- */
T('safari','safari|jeep safari|elephant safari|elephant ride|safari booking|safari timing|safari ticket|safari ka|safari kaise|safari koto|safari-r|safari er|সাফারি|सफारी|जीप',
 ["Jeep safaris run in Gorumara and Jaldapara, and Jaldapara also has elephant safaris 🐘","Slots are limited, so book early in peak season (November to February). Jaldapara has recently started online booking. A jeep usually costs around ₹2,500 to ₹4,500 per trip, and an elephant ride about ₹1,000 to ₹1,500 per person. Please treat those as rough, the team confirms exact fees."],
 ["Gorumara aur Jaldapara mein jeep safari hoti hai, aur Jaldapara mein elephant safari bhi hai 🐘","Slots kam hote hain, isliye peak season (November se February) mein jaldi book karein. Jaldapara mein ab online booking shuru hui hai. Jeep ka kharcha lagbhag ₹2,500 se ₹4,500 per trip, aur elephant ride lagbhag ₹1,000 se ₹1,500 per person. Ye andaza hai, exact fees hamari team confirm karegi."],
 ["Gorumara ar Jaldapara-y jeep safari hoy, ar Jaldapara-y elephant safari-o ache 🐘","Slot kom, tai peak season (November theke February) e age theke book korun. Jaldapara-y ekhon online booking shuru hoyeche. Jeep-er khoroch proay ₹2,500 theke ₹4,500 per trip, ar elephant ride proay ₹1,000 theke ₹1,500 per person. Eta ekta andaaj, exact fee amader team confirm korbe."],
 {next:['plan','sighting','jaldapara']});
T('sighting','will i see|will we see|guarantee|sure to see|chance of seeing|chances of seeing|sighting|see rhino|see tiger|see elephant|see leopard|tiger milega|rhino milega|janwar dikhega|dikhega kya|dikhenge|dekha jabe|dekha jay|dekhte pabo|bagh dekha|দেখা যাবে|দেখতে পাব|दिखेगा|दिखेंगे',
 ["Honestly, nobody can guarantee a sighting, it's wild forest 🌿 I'd rather be upfront than promise.","Jaldapara is your best bet for rhinos (it has the second largest rhino population in India after Kaziranga). Early morning safaris are usually best. Tigers are very rarely seen here."],
 ["Sach kahun to koi bhi sighting ki guarantee nahi de sakta, ye wild jungle hai 🌿 Main jhoothi umeed nahi dena chahta.","Rhino ke liye Jaldapara sabse achha hai (Kaziranga ke baad India mein sabse zyada rhino yahin hain). Subah ki safari aam taur par best hoti hai. Tiger yahan bahut kam dikhte hain."],
 ["Satti bolte, keu sighting-er guarantee dite pare na, eta jongol 🌿 Ami mithye ashwas dite chai na.","Rhino dekhar jonno Jaldapara sobcheye bhalo (Kaziranga-r por Bharote sobcheye beshi rhino ekhane). Bhor-er safari sadharonoto bhalo. Bagh ekhane khub kom dekha jay."],
 {next:['jaldapara','gorumara','plan']});
T('jaldapara','jaldapara|hollong|holong|madarihat|rhino|rhinoceros|gainda|gaida|gonda|জলদাপাড়া|জলদাপাড়া|जलदापाड़ा|गैंडा',
 ["Jaldapara is the place for the one-horned rhino 🦏 It's a big park (about 216 sq km) with jeep and elephant safaris, and Hollong or Madarihat is the usual base.","Stay at least one night nearby so you can do an early morning safari."],
 ["Jaldapara ek-singh wale rhino ke liye jaana jaata hai 🦏 Ye bada park hai (lagbhag 216 sq km) jahan jeep aur elephant safari hoti hai, aur Hollong ya Madarihat mein rukna theek rehta hai.","Kam se kam ek raat paas mein rukein taaki subah ki safari mil sake."],
 ["Jaldapara ek-shringo rhino-r jonno bikhyato 🦏 Boro park (proay 216 sq km), jeep ar elephant safari ache, ar Hollong ba Madarihat-e thaka sobcheye bhalo.","Ontoto ek raat kache thakun jate bhor-er safari paan."],
 {next:['safari','plan','stay'],ctx:'jaldapara'});
T('gorumara','gorumara|lataguri|chapramari|murti|chalsa|ramsai|গোরুমারা|লাটাগুড়ি|गोरुमारा|लटागुड़ी',
 ["Gorumara is smaller (about 80 sq km) but lovely: dense forest, watchtowers, and rhino, elephants, bison and lots of birds 🌳","Lataguri is the usual base, and the jeep safaris go out twice a day. Murti is quieter, Chalsa is a little more upscale."],
 ["Gorumara chhota hai (lagbhag 80 sq km) par bahut sundar: ghana jungle, watchtowers, rhino, haathi, gaur aur bahut saare birds 🌳","Lataguri mein rukna sabse aam hai, aur jeep safari din mein do baar jaati hai. Murti zyada shaant hai, Chalsa thoda upscale."],
 ["Gorumara chhoto (proay 80 sq km) kintu darun: ghono jongol, watchtower, rhino, hati, gaur ar onek pakhi 🌳","Lataguri-te thaka sobcheye chalu, jeep safari diney dubar jay. Murti besi shanto, Chalsa ektu upscale."],
 {next:['safari','plan','stay'],ctx:'gorumara'});
T('compare','which is better|which one is better|jaldapara or gorumara|gorumara or jaldapara|difference between|kaun sa better|kaun sa achha|konta bhalo|konta better|কোনটা ভালো|कौन सा बेहतर|कौन सा अच्छा|darjeeling or|sikkim or|dooars vs|dooars or',
 ["Both are great, just different 🙂 Gorumara is smaller and denser, with watchtowers. Jaldapara is bigger with open grassland, famous for rhinos and elephant safari.","With 3 or more days, do both. If you only have time for one, pick Jaldapara for rhinos, Gorumara for forest and birds. Dooars is plains, forests and tea, while Darjeeling and Sikkim are mountains, so it depends what you want."],
 ["Dono achhe, bas alag 🙂 Gorumara chhota aur ghana hai, watchtowers ke saath. Jaldapara bada aur khula ghaas ka maidan hai, rhino aur elephant safari ke liye mashhoor.","3 din ya zyada ho to dono karein. Ek hi chunna ho to rhino ke liye Jaldapara, jungle aur birds ke liye Gorumara. Dooars maidan, jungle aur chai ka hai, Darjeeling aur Sikkim pahad hain, to aapki pasand par hai."],
 ["Dutoi bhalo, kintu alada 🙂 Gorumara chhoto ar ghono, watchtower ache. Jaldapara boro, khola ghaser mathh, rhino ar elephant safari-r jonno bikhyato.","3 din ba beshi hole dutoi korun. Ekta bachte hole rhino-r jonno Jaldapara, jongol ar pakhir jonno Gorumara. Dooars somotol, jongol ar chaa-er, Darjeeling ar Sikkim pahar, tai apnar pochondo onujayi."],
 {next:['plan','jaldapara','gorumara']});
T('buxa','buxa|jayanti|santalabari|lepchakha|fort|buxa fort|trek|trekking|hike|offbeat|adventure|বক্সা|জয়ন্তী|बक्सा|जयंती|ट्रेक',
 ["Buxa and Jayanti are quieter and more adventurous: river-bed walks, forest trails, and a trek to Buxa Fort (roughly a 2 hour walk from Santalabari) 🥾","Great if you want fewer crowds. The trek is moderate, so not ideal for very young kids or elders."],
 ["Buxa aur Jayanti zyada shaant aur adventurous hain: nadi ke kinare walk, jungle ke raste, aur Buxa Fort ki trek (Santalabari se lagbhag 2 ghante ki paidal) 🥾","Bheed se door rehna ho to bahut achha. Trek medium level ki hai, bahut chhote bachchon ya buzurgon ke liye theek nahi."],
 ["Buxa ar Jayanti besi shanto ar adventurous: nodir dhare hnata, jongoler poth, ar Buxa Fort-er trek (Santalabari theke proay 2 ghonta hnata) 🥾","Bheer charte chaile darun. Trek ta majhari, khub chhoto bachcha ba boyoshko-der jonno thik noy."],
 {next:['plan','days'],ctx:'buxa'});
T('samsing','samsing|suntalekhola|suntale|rocky island|offbeat village|village stay|শামসিং|সুনতালেখোলা|सामसिंग|सुंतालेखोला',
 ["Samsing and Suntalekhola are peaceful villages at the edge of the hills, with tea gardens, rivers and short forest walks 🍃 Rocky Island near Murti is popular for sunset, camping and stargazing.","Good for a slow, relaxed day. Mobile network can be patchy in some spots."],
 ["Samsing aur Suntalekhola pahadi kinare ke shaant gaon hain, chai bagan, nadi aur chhoti jungle walk ke saath 🍃 Murti ke paas Rocky Island sunset, camping aur stargazing ke liye mashhoor hai.","Aaram wale din ke liye achha. Kuch jagah mobile network kamzor rehta hai."],
 ["Samsing ar Suntalekhola pahar-er dhare shanto gram, chaa-bagan, nodi ar chhoto jongol hnata niye 🍃 Murti-r kache Rocky Island sunset, camping ar stargazing-er jonno jonopriyo.","Ramro, aramer din-er jonno bhalo. Kichu jayga-y mobile network durbol."],
 {next:['plan','stay'],ctx:'samsing'});
T('tea','tea garden|tea gardens|tea estate|tea estates|tea tourism|tea tasting|plantation|chai bagan|chai bagaan|chai ke bagan|chaa bagan|cha bagan|চা বাগান|চা-বাগান|चाय बागान',
 ["Tea garden walks are one of the nicest things about the Dooars 🍵 The Chalsa and Samsing side has many estates.","Some estates allow walks and tastings, but access varies, so we arrange visits in advance rather than you turning up at the gate."],
 ["Chai bagan ki sair Dooars ki sabse achhi cheezon mein se hai 🍵 Chalsa aur Samsing ke taraf bahut estates hain.","Kuch estates mein walk aur tasting ho jaati hai, par access alag-alag hota hai, isliye hum pehle se arrange karte hain."],
 ["Chaa-bagane hnata Dooars-er sobcheye bhalo jinish-er ekta 🍵 Chalsa ar Samsing-er dike onek estate ache.","Kichu estate-e hnata ar tasting hoy, tobe access alada, tai amra age theke byabostha kori."],
 {next:['plan','stay'],ctx:'tea'});
T('things','things to do|what to do|what to see|places to visit|places to see|tourist places|attractions|sightseeing|worth visiting|kya karna|kya dekhna|kya kya dekhe|ghoomne ki jagah|dekhne layak|ki ki dekhbo|ki dekhar ache|ghurar jayga|কী কী দেখব|কি কি দেখার|ঘোরার জায়গা|क्या देखें|घूमने की जगह|क्या करें',
 ["The Dooars has a lot packed in 🌿 Jeep and elephant safaris, tea garden walks, river-bed picnics at Murti, birdwatching, a trek to Buxa Fort, village stays, and even a day trip to the Bhutan border.","Tell me what you enjoy (wildlife, nature, adventure) and I'll pick the best for your days."],
 ["Dooars mein dekhne ko bahut kuch hai 🌿 Jeep aur elephant safari, chai bagan walk, Murti nadi par picnic, birdwatching, Buxa Fort trek, gaon ke stays, aur Bhutan border ka day trip bhi.","Bataiye aapko kya pasand hai (wildlife, nature, adventure), main aapke dino ke hisaab se best chunta hoon."],
 ["Dooars-e dekhar onek kichu ache 🌿 Jeep ar elephant safari, chaa-bagane hnata, Murti nodir dhare picnic, birdwatching, Buxa Fort trek, gramer stay, ar Bhutan border-er day trip-o.","Ki bhalo lage bolun (wildlife, nature, adventure), ami apnar dinguli onujayi sera ta bachbo."],
 {next:['plan','days','price']});
T('bhutan','bhutan|jaigaon|phuentsholing|phuntsholing|bhutan gate|bhutan border|bhutan jana|bhutan jaoya|bhutan jabo|ভুটান|জয়গাঁ|भूटान|जयगांव',
 ["You can visit the Jaigaon and Phuentsholing border town as a day trip from the eastern Dooars 🇧🇹 Indian visitors don't need a visa but do need a valid photo ID, and going beyond the border town needs a permit.","Rules change often, so our team confirms the latest before you go."],
 ["Jaigaon aur Phuentsholing border town ko eastern Dooars se day trip mein dekha ja sakta hai 🇧🇹 Indian visitors ko visa nahi chahiye par valid photo ID zaroori hai, aur border town ke aage jaane ke liye permit lagta hai.","Rules badalte rehte hain, isliye jaane se pehle hamari team latest confirm karti hai."],
 ["Jaigaon ar Phuentsholing border town eastern Dooars theke day trip-e dekha jay 🇧🇹 Bharotiyo-der visa lage na kintu valid photo ID lage, ar border town-er baire jete permit lage.","Niyom prayoi bodlay, tai jawar age amader team latest confirm kore."],
 {next:['plan','days','human'],caution:true});
T('totopara','toto|totopara|toto village|toto tribe|tribal village|আদিবাসী|টোটো|तोतो|टोटोपाड़ा',
 ["Totopara is a very small village of the Toto tribe near the Bhutan border. The road can be rough, with river crossings that may be impassable in the rains.","Visits can need prior permission, so I'd rather our team check the current rules for your dates than guess. Want them to look into it?"],
 ["Totopara Toto janjati ka bahut chhota gaon hai, Bhutan border ke paas. Raasta kharab ho sakta hai aur barish mein nadi paar karna mushkil ho sakta hai.","Kabhi-kabhi pehle se permission lagti hai, isliye main andaza lagane ke bajay hamari team se aapki dates ke liye latest rules check karwaunga. Unse pooch lein?"],
 ["Totopara Bhutan border-er kache Toto adibasi-der khub chhoto gram. Rasta khaarap hote pare, borsha-y nodi paar howa kothin hote pare.","Kokhono age theke onumoti lage, tai ami andaje na bole amader team-ke apnar tarikh-er jonno latest niyom dekhte bolbo. Ora dekhuk?"],
 {next:['human','plan'],caution:true});
T('weather','weather|temperature|how cold|how hot|cold in|hot in|climate|will it rain|thand|garmi|mausam|aabohaowa|abohawa|thanda|gorom|শীত|গরম|আবহাওয়া|मौसम|ठंड|गर्मी',
 ["Winters (November to February) are pleasant and cool, with foggy, chilly mornings. Summers are warm and humid, and the monsoon (June to September) brings heavy rain 🌦️","Carry a light jacket for winter evenings."],
 ["Sardi (November se February) mein mausam suhana aur thanda rehta hai, subah kohra aur thand. Garmi mein garam aur umas, aur monsoon (June se September) mein bhaari barish hoti hai 🌦️","Sardi ki shaam ke liye halka jacket rakhein."],
 ["Sheet (November theke February) mone mugdhokor, thanda, bhor-e kuyasha. Grishme gorom ar bhyapsa, ar monsoon (June theke September) e bhari borsha hoy 🌦️","Sheeter sondhyay halka jacket niye nin."],
 {next:['besttime','plan']});
T('packing','what should i pack|should i pack|what to bring|what to pack|what to carry|what should i carry|packing|what to wear|dress|clothes|kya le jaye|kya lekar jaye|kya pehne|kapde|ki niye jabo|ki porbo|ki nebo|কী নিয়ে যাব|কি নিয়ে যাব|क्या ले जाएं|क्या पहनें',
 ["Light cotton or layers, a jacket in winter, comfortable walking shoes, a hat, sunscreen, a torch, and a photo ID 🎒","For safaris, muted colours (green, brown, grey) are better than bright ones. Add a raincoat if you're going between June and September."],
 ["Halke cotton ya layers, sardi mein jacket, aaramdayak walking shoes, topi, sunscreen, torch aur photo ID 🎒","Safari ke liye bright rang ke bajay hara, bhura ya grey behtar hai. June se September ke beech ja rahe ho to raincoat bhi rakhein."],
 ["Halka cotton ba layer, sheeter jonno jacket, aramer walking shoe, tupi, sunscreen, torch ar photo ID 🎒","Safari-r jonno ujjol rong-er bodole sobuj, khoyeri ba grey bhalo. June theke September-e gele raincoat nin."],
 {next:['plan','weather']});
T('network','mobile network|network|signal|internet|wifi|wi-fi|atm|cash|upi|phonepe|gpay|network milta|network hoga|network kaisa|network kemon|network ache|টাওয়ার|নেটওয়ার্ক|नेटवर्क|एटीएम',
 ["Mobile network is patchy in some places like Murti and Ramsai, and small villages may not have ATMs or UPI, so carry some cash 💵","Bigger towns and most resorts are fine."],
 ["Murti aur Ramsai jaisi kuch jagah network kamzor rehta hai, aur chhote gaon mein ATM ya UPI na ho sakta hai, isliye kuch cash saath rakhein 💵","Bade shehron aur zyadatar resorts mein dikkat nahi hoti."],
 ["Murti ar Ramsai-r moto kichu jayga-y network durbol, ar chhoto gram-e ATM ba UPI na-o thakte pare, tai kichu cash niye nin 💵","Boro shohor ar beshirbhag resort-e osubidha hoy na."],
 {next:['packing','plan']});
T('language','language|which language|what language|hindi chalega|english chalega|bengali|bangla|nepali|bhasha|kaun si bhasha|kon bhasha|ki bhasha|ভাষা|भाषा',
 ["Bengali is the main language, and Sadri, Nepali and Hindi are also widely spoken. Guides and hotels manage fine in Hindi and English 🙂"],
 ["Yahan mukhya bhasha Bangla hai, aur Sadri, Nepali aur Hindi bhi bahut boli jaati hai. Guides aur hotels mein Hindi aur English se kaam chal jaata hai 🙂"],
 ["Ekhane mukhyo bhasha Bangla, ar Sadri, Nepali ar Hindi-o onek bola hoy. Guide ar hotel-e Hindi ar English-e kaj chole jay 🙂"],
 {next:['plan','stay']});

/* ---------- stay, food, people ---------- */
T('stay','stay|stays|hotel|hotels|resort|resorts|lodge|accommodation|room|rooms|where to stay|kahan rukein|kahan ruke|kahan thahre|rehne ki jagah|rukne ki jagah|kothay thakbo|thakar jayga|thakar jaiga|ghor|kothay thakte|কোথায় থাকব|থাকার জায়গা|হোটেল|रुकने|कहाँ रुकें|होटल|रिसॉर्ट',
 ["You have three kinds of stay 🏡 forest lodges and eco-cottages run by the state, private resorts and hotels (mostly around Lataguri, Chalsa and Madarihat), and simple village homestays.","Tell me your budget and who's travelling, and I'll suggest what fits."],
 ["Teen tarah ke stay milte hain 🏡 sarkari forest lodges aur eco-cottages, private resorts aur hotels (zyadatar Lataguri, Chalsa aur Madarihat ke paas), aur saade gaon ke homestays.","Apna budget aur kaun jaa raha hai bataiye, main sahi wala suggest karunga."],
 ["Tin dhoroner stay pawa jay 🏡 sarkari forest lodge ar eco-cottage, private resort ar hotel (beshirbhag Lataguri, Chalsa ar Madarihat-er kache), ar sada-shide gramer homestay.","Apnar budget ar ke ke jachchen bolun, ami upojogi ta bolbo."],
 {next:['homestay','price','plan']});
T('homestay','homestay|home stay|village stay|local family|home cooked|ghar jaisa|gaon mein rukna|gram-e thaka|homestay ache|হোমস্টে|होमस्टे',
 ["Homestays are a lovely way to see village life 🏡 simple rooms, home-cooked food, and very warm hospitality. They're usually the most budget-friendly too.","I can add one to your plan if you like."],
 ["Homestay gaon ki zindagi dekhne ka achha tareeka hai 🏡 saade kamre, ghar ka khana aur garmjoshi se swagat. Aam taur par sabse budget-friendly bhi hote hain.","Chahein to main plan mein ek add kar doon."],
 ["Homestay gramer jibon dekhar sundor upay 🏡 sada ghor, barir ranna ar uushno atithiyeta. Sadharonoto sobcheye budget-friendly-o.","Chaile ami plan-e ekta jure dei."],
 {next:['plan','price']});
T('food','food|eat|eating|restaurant|cuisine|dish|local food|khana|khane|khana kaisa|khane ko|khabar|khabar kemon|kothay khabo|ki khabo|ranna|খাবার|খাওয়া|खाना|खाने',
 ["Expect home-style Bengali food plus local tribal and Rajbanshi flavours: rice, river fish, greens, bamboo shoot 🍛","Your stay will usually serve the meals, so you won't hunt for restaurants. Tell them any preferences when booking."],
 ["Ghar jaisa Bengali khana aur local adivasi aur Rajbanshi swaad milega: chawal, nadi ki machhli, saag, bans ke kopal (bamboo shoot) 🍛","Aapka stay aam taur par khana deta hai, to restaurant dhoondhne ki zaroorat nahi. Booking ke time apni pasand bata dein."],
 ["Barir moto Bangali ranna ar sthaniyo adibasi o Rajbanshi swad pawa jay: bhat, nodir mach, shak, bnaser konda 🍛","Apnar stay-e sadharonoto khabar dey, restaurant khujte hobe na. Booking-er somoy apnar pochondo bole dien."],
 {next:['veg','stay','plan']});
T('veg','veg|vegetarian|pure veg|jain|vegan|non veg|nonveg|non-veg|veg khana|shakahari|niramish|nirbhej|ভেজ|নিরামিষ|शाकाहारी|वेज',
 ["Vegetarian food is usually easy to get at resorts and homestays 🥗 Just mention it when booking so they prepare for you. Jain or strict vegan meals need advance notice."],
 ["Resorts aur homestays mein veg khana aam taur par mil jaata hai 🥗 Bas booking ke time bata dein. Jain ya strict vegan khane ke liye pehle se batana padega."],
 ["Resort ar homestay-e niramish khabar sadharonoto pawa jay 🥗 Booking-er somoy bole dien. Jain ba strict vegan khabar-er jonno age theke jaanate hobe."],
 {next:['stay','plan']});

/* ---------- who is travelling ---------- */
T('family','kids|children|child|baby|infant|with family|family trip|bachche|bachchon|bachcha|bacche|chhote bachche|parivar|bachcha niye|chheleme|chhoto bachcha|poribar|ছোট বাচ্চা|বাচ্চা|পরিবার|बच्चे|बच्चों|परिवार',
 ["Yes, the Dooars works really well with kids 👨‍👩‍👧 Safaris, tea gardens and river picnics are a hit with children.","Keep drives under about 3 hours a day and carry snacks and sun protection. Shall I plan a family trip?"],
 ["Ji haan, Dooars bachchon ke saath bahut achha rehta hai 👨‍👩‍👧 Safari, chai bagan aur nadi par picnic bachchon ko pasand aate hain.","Din mein 3 ghante se kam drive rakhein aur snacks aur sunscreen saath rakhein. Family trip plan kar doon?"],
 ["Hya, Dooars bachchader sathe khub bhalo 👨‍👩‍👧 Safari, chaa-bagan ar nodir dhare picnic bachchader pochondo.","Diney 3 ghontar kom gari rakhun ar snack, sunscreen niye nin. Family trip-er plan kori?"],
 {next:['plan','stay','price']});
T('elderly','senior|elderly|old people|old parents|aged|parents are old|senior citizen|buzurg|bujurg|bade log|mummy papa|bura|boyoshko|baba ma|bodhho|বয়স্ক|বৃদ্ধ|बुजुर्ग|बड़े बुजुर्ग|सीनियर',
 ["Mostly yes 🙂 Plan fewer stops, stay close to the park (Lataguri or Hollong), and skip treks like Buxa Fort. Jeep safaris are fine, though the ride can be bumpy.","Tell me the group and I'll keep it comfortable."],
 ["Zyadatar haan 🙂 Kam jagah rakhein, park ke paas rukein (Lataguri ya Hollong) aur Buxa Fort jaisi trek chhod dein. Jeep safari theek hai, bas raasta hichkole wala ho sakta hai.","Group bataiye, main aaramdayak plan banaunga."],
 ["Prai hya 🙂 Kom jayga rakhun, park-er kache thakun (Lataguri ba Hollong) ar Buxa Fort-er moto trek bad din. Jeep safari thik, tobe rasta jhaanki-wala hote pare.","Group-er kotha bolun, ami aramdayak plan banabo."],
 {next:['plan','stay']});
T('honeymoon','honeymoon|couple|couples|romantic|anniversary|just married|newly married|honeymoon ke liye|romantic jagah|shaadi ke baad|biye-r por|bou niye|biwi|patni|hubby|wife|husband|honeymoon-er jonno|হানিমুন|বউ|विवाह|हनीमून',
 ["It makes a quiet, lovely honeymoon 💚 forest resorts, river views, tea gardens and starry evenings. It's more peace and nature than party scene.","Want a couple-friendly plan? I'll pick a nice resort style and a slower pace."],
 ["Ye ek shaant, pyaara honeymoon ban sakta hai 💚 jungle resorts, nadi ka nazara, chai bagan aur taaron bhari shaam. Yahan party nahi, shanti aur prakriti hai.","Couple-friendly plan chahiye? Main achha resort aur dheema pace rakhunga."],
 ["Eta ekta shanto, sundor honeymoon hote pare 💚 jongoler resort, nodir drishyo, chaa-bagan ar tarar akash. Party noy, shanti ar prokriti.","Couple-er jonno plan chai? Ami bhalo resort ar dhire cholar plan rakhbo."],
 {next:['plan','stay','price']});
T('solo','safe for solo|solo girl|solo female|solo woman|solo traveller|solo travel|akela ja raha|akeli ja rahi|ekla jabo|ekla jachchi|girls alone|women alone|female traveller|solo|alone|akela|akeli|single traveller|solo trip|female solo|girl travelling|ladies|women safe|safe for women|safe for girls|ekla|ekai|eka jabo|একা|मैं अकेला|अकेली|अकेले',
 ["Plenty of solo travellers go, and it's generally a calm region 🙂 Choose a reliable stay, avoid travelling late at night on forest roads, and share your plan with someone back home.","I can suggest well-run stays for solo travellers if you tell me your dates."],
 ["Kaafi solo travellers jaate hain aur ye aam taur par shaant ilaka hai 🙂 Bharosemand stay chunein, raat ko jungle ke raaston par safar na karein aur apna plan ghar par kisi ko bata dein.","Dates bataiye, main solo travellers ke liye achhe stays suggest kar doonga."],
 ["Onek solo traveller jay, ar eta sadharonoto shanto elaka 🙂 Nirbhorjogyo stay bachun, raate jongoler rastay jatayat korben na, ar apnar plan bari-te keu-ke janiye din.","Tarikh bolun, ami solo-der jonno bhalo stay bole debo."],
 {next:['plan','stay']});
T('safety','is it safe|safe to travel|safe place|is dooars safe|safety|safe hai|safe hoga|safe rahega|safe ache|safe hobe|safe kina|nirapod|nirapotta|suraksha|surokkha|ota ki safe|safe|সুরক্ষা|নিরাপদ|सुरक्षित|सेफ',
 ["The Dooars is generally calm and tourist-friendly 🙂 The main thing to respect is the wildlife: don't walk alone in forest areas, don't stop on forest roads at night (elephants cross them), and follow your guide's instructions.","Stay at a reliable place and travel on forest roads in daylight, and you'll be fine."],
 ["Dooars aam taur par shaant aur tourist-friendly hai 🙂 Sabse zaroori hai jungle ke janwaron ka dhyan rakhna: jungle mein akele paidal na jaayein, raat ko jungle ke raaston par na rukein (haathi paar karte hain), aur guide ki baat maanein.","Bharosemand jagah rukein aur jungle ke raaste din mein hi taiy karein, sab theek rahega."],
 ["Dooars sadharonoto shanto ar tourist-friendly 🙂 Sobcheye joruri holo jongoler jibjontu-r proti shromdha: jongole ekla hnatben na, raate jongoler rastay thambenna (hati paar hoy), ar guide-er kotha shunben.","Bhalo jayga-y thakun ar jongoler rasta diney-i parapar korun, thik thakbe."],
 {next:['plan','stay','solo']});
T('group','group|big group|large group|friends group|office trip|corporate|bachelor|20 people|15 people|10 people|group of|bahut log|zyada log|dost log|friends ke saath|bondhura|bondhu der sathe|onek jon|বন্ধু|দল|ग्रुप|दोस्तों',
 ["Yes, we can plan for groups 🎉 Bigger groups need earlier booking because safari slots and rooms are limited.","How many people are you, and which month?"],
 ["Haan, groups ke liye bhi plan ho jaata hai 🎉 Bade groups ke liye pehle se booking zaroori hai kyunki safari slots aur rooms kam hote hain.","Aap kitne log hain aur kaun sa mahina?"],
 ["Hya, group-er jonno-o plan hoy 🎉 Boro group-er age theke booking dorkar, karon safari slot ar room kom.","Apnara koyjon, ar kon mas?"],
 {next:['plan','price','human']});

/* ---------- money ---------- */
T('price','price|cost|how much|budget|rate|rates|package|packages|tour package|charges|expense|expenses|per person|kitna kharcha|kitna kharch|kitna lagega|kitne ka|kitne paise|kitna paisa|price kya|rate kya|kharcha|kharch|paisa|koto khoroch|koto lagbe|koto taka|dam koto|koto dam|khoroch|taka|দাম কত|কত খরচ|কত টাকা|খরচ|कितना खर्च|कितना लगेगा|कितने का|खर्चा|रेट|कीमत',
 ["Here's a rough idea for 3 nights / 4 days, per person 💰 budget about ₹6,000 to ₹6,500, mid-range about ₹9,000 to ₹10,000, and comfortable or premium resorts from around ₹15,000.","That usually doesn't include travel to Bagdogra/NJP, and safari tickets are often extra. For an exact quote I need your dates and group size."],
 ["3 raat / 4 din ka andaza, per person 💰 budget lagbhag ₹6,000 se ₹6,500, mid-range lagbhag ₹9,000 se ₹10,000, aur comfortable ya premium resorts ₹15,000 se shuru.","Isme aam taur par Bagdogra/NJP tak ka safar shamil nahi hota, aur safari ticket alag lagte hain. Exact quote ke liye aapki dates aur group size chahiye."],
 ["3 raat / 4 din-er andaj, per person 💰 budget proay ₹6,000 theke ₹6,500, mid-range proay ₹9,000 theke ₹10,000, ar comfortable ba premium resort ₹15,000 theke shuru.","Eta-te sadharonoto Bagdogra/NJP porjonto jatayat dhora thake na, ar safari ticket alada. Exact quote-er jonno apnar tarikh ar group-er sonkhya lagbe."],
 {next:['plan','expensive','human'],caution:true});
T('expensive','onek beshi|onek dam|dam onek|khub beshi|expensive|too much|too costly|costly|very high|high price|can\'t afford|cannot afford|cheaper|cheap option|low budget|tight budget|mehenga|mehnga|bahut zyada|thoda zyada|budget nahi|budget kam|sasta|sasta option|dam beshi|beshi dam|khub dam|dami|budget nei|budget kom|kom dam|sosta|সস্তা|বেশি দাম|দাম বেশি|বাজেট কম|महंगा|ज़्यादा है|सस्ता|बजट कम',
 ["I understand 🙂 We can bring it down: stay in a homestay, travel outside peak season (March or after the monsoon), or trim a day.","Want me to rework the plan on a tighter budget?"],
 ["Samajh sakta hoon 🙂 Hum kharcha kam kar sakte hain: homestay mein rukein, peak season ke bahar jaayein (March ya monsoon ke baad), ya ek din kam karein.","Chahein to main tight budget mein plan dobara bana doon?"],
 ["Bujhte parchi 🙂 Khoroch kom kora jay: homestay-e thakun, peak season-er baire jan (March ba monsoon-er por), ba ek din kom korun.","Chaile ami tight budget-e plan abar banai?"],
 {next:['plan','homestay','human'],act:'budgetdown'});
T('discount','discount|offer|any offer|deal|reduce|negotiate|best price|last price|final price|kam karo|thoda kam|kam kar do|chhoot|discount milega|discount do|offer hai|koshi|kom hobe|kom kora jay|chhar|discount hobe|ছাড়|ডিসকাউন্ট|छूट|डिस्काउंट|कम करो',
 ["I can't change prices myself, but our team can look for the best option for your dates and group size 🙂 Shall I note your details so they can reach out?"],
 ["Prices main khud nahi badal sakta, par hamari team aapki dates aur group ke hisaab se best option dekh sakti hai 🙂 Aapki details note kar loon taaki wo sampark karein?"],
 ["Dam ami nijei bodlate pari na, kintu amader team apnar tarikh ar group onujayi best option dekhte pare 🙂 Apnar details note kori jate ora jogajog kore?"],
 {next:['human','plan'],act:'offerlead'});
T('payment','payment|advance|pay advance|refund|cancel|cancellation|cancelled|money back|how to pay|payment link|paisa wapas|refund milega|cancel karna|advance dena|paise kaise|taka ferot|cancel korte|advance dite|taka kibhabe|পেমেন্ট|রিফান্ড|বাতিল|पेमेंट|रिफंड|कैंसल',
 ["Payment and cancellation terms are handled by our team so everything is clear and in writing 📝 I can't quote them myself. Shall I take your details so they can call you?"],
 ["Payment aur cancellation ki shartein hamari team sambhalti hai taaki sab kuch saaf aur likhit mein ho 📝 Main khud bata nahi sakta. Aapki details le loon taaki wo call karein?"],
 ["Payment ar cancellation-er shortgulo amader team dekhe jate sob likhito ar poriskar thake 📝 Ami nijey bolte pari na. Apnar details nei jate ora call kore?"],
 {next:['human'],act:'offerlead'});
T('booking','get a quote|quote|quotation|quote chahiye|quote chai|quote do|quote den|quote dijiye|कोटेशन|কোটেশন|book|book it|book now|booking|i want to book|reserve|confirm|confirm it|go ahead|lets go|let\'s go|book kar do|book karna hai|book karo|booking karni|book korte chai|book korbo|book kore din|buking|বুক|বুকিং|बुक|बुकिंग',
 ["Happy to get that moving 🙂 I can't confirm bookings myself, but a human planner will take it from here."],
 ["Ye karte hain 🙂 Booking main khud confirm nahi kar sakta, par hamari team aage sambhal legi."],
 ["Cholun ei kaj shuru kori 🙂 Booking ami nijey confirm korte pari na, kintu amader team ekhan theke dekhbe."],
 {act:'lead'});
T('contact','how can i contact|how do i contact|how can i reach you|how do i reach you|how to reach you|whom should i contact|whom should i reach|who should i reach|whom to call|whom to contact|who to contact|who should i contact|who can i contact|whom should i call|who should i call|who do i call|who can i call|who can i talk to|whom can i talk|your number|your phone number|your contact|contact details|contact info|contact number|phone number|whatsapp number|office number|helpline|customer care|kisko contact|kisko call|kis se sampark|kisse sampark|kisse baat|kaun sa number|number kya hai|number do|number dijiye|apka number|aapka number|sampark number|kar sathe jogajog|kake phone|kake call|ke dekhbe|kake bolbo|number den|number ta ki|apnader number|jogajog korbo|ফোন নাম্বার|যোগাযোগ|কার সাথে|नंबर क्या|नंबर दो|किससे बात|किससे संपर्क|संपर्क',
 ['Our trip planners will contact you personally. If you share your name and WhatsApp number, I will pass them on to the team.'],
 ['Hamare trip planners aapse khud sampark karenge. Aap apna naam aur WhatsApp number bata dein, main team tak pahuncha doonga.'],
 ['Amader trip planner apnar sathe nijei jogajog korben. Apni naam ar WhatsApp number bolle ami team-ke jani die debo.'],
 {act:'contact'});
T('human','human|agent|real person|a person|talk to someone|talk to a person|speak to someone|speak to a human|call me|call back|callback|support|team se baat|kisi se baat|insaan se|aadmi se|call karo|phone karo|call karna|kotha bolte chai|manush er sathe|call korun|phone korun|ফোন|কল করুন|মানুষ|इंसान|कॉल|टीम से',
 ["Sure 🙂 I'm alerting a human planner. In a live setup they get a notification and carry on in this same chat.","Shall I take your name and number so they can reach you directly?"],
 ["Zaroor 🙂 Main hamari team ko alert kar raha hoon. Live setup mein unhe notification milta hai aur wo isi chat mein aage baat karte hain.","Aapka naam aur number le loon taaki wo seedhe sampark kar sakein?"],
 ["Nishchoy 🙂 Ami amader team-ke alert korchi. Live setup-e ora notification pay ar ei chat-e-i kotha bole.","Apnar naam ar number nei jate ora sorasori jogajog korte pare?"],
 {act:'offerlead'});
T('complaint','complaint|complain|problem|issue|bad experience|disappointed|not happy|unhappy|angry|cheated|fraud|worst|bekar|bekaar|shikayat|pareshani|gussa|dhokha|kharab|khub kharap|oviyog|obhijog|osubidha|rag hochche|ঠকিয়েছে|অভিযোগ|শিকায়েত|शिकायत|धोखा|परेशानी',
 ["I'm really sorry about that 🙏 I don't want to guess, so let me get a real person to look into it right away."],
 ["Mujhe iska sach mein afsos hai 🙏 Main andaza nahi lagana chahta, isliye abhi kisi insaan se is par dhyan dilwata hoon."],
 ["Eta shune sotti dukkhito 🙏 Ami andaje kichu bolte chai na, tai ekhuni ekjon manush-ke dekhte bolchi."],
 {act:'offerlead'});

/* ---------- things we say no to ---------- */
T('emergency','emergency|ambulance|doctor|hospital|medical|medicine|snake bite|snakebite|injury|injured|police|accident|urgent help|lawyer|legal|insurance claim|chikitsa|dawai|dawa|hospital kahan|doctor chahiye|daktar|doktor|haspatal|police-e|durghotona|ডাক্তার|হাসপাতাল|পুলিশ|ডাক্তার|डॉक्टर|अस्पताल|पुलिस|एम्बुलेंस',
 ["I can't help with medical, legal or emergency matters 🙏 If someone is in danger, please call *112* (India's emergency number) right now, or contact a local doctor or hospital."],
 ["Main medical, kanooni ya emergency maamlon mein madad nahi kar sakta 🙏 Agar koi khatre mein hai to abhi *112* (India ka emergency number) par call karein ya paas ke doctor ya hospital se milein."],
 ["Ami medical, ain-sonkranto ba emergency byapare sahajyo korte pari na 🙏 Kew bipode thakle ekhuni *112* (Bharoter emergency number) e call korun ba kache-r daktar ba hospital-e jan."],
 {act:'emergency'});
T('scope','mla|mp |member of parliament|minister|chief minister|cm |prime minister|politic|politics|election|vote|voting|party|bjp|tmc|cpm|congress|modi|mamata|government scheme|scheme|census|population|cricket|ipl|football score|movie|film|stock|share market|bitcoin|crypto|lottery|neta|sarkar|sarkari yojana|chunav|rajneeti|vidhayak|saansad|mantri|matdaan|rajniti|vidhayok|nirbachon|sorkar|bhot|mukhyomontri|রাজনীতি|নির্বাচন|ভোট|বিধায়ক|সাংসদ|রাজনীति|राजनीति|चुनाव|विधायक|सांसद|मंत्री|सरकार',
 ["That's outside what I can help with, I only do Dooars trip planning 🙂 Happy to help with places, stays, safaris, costs or a day-by-day plan if you like."],
 ["Ye mere kaam ke bahar hai, main sirf Dooars trip planning mein madad karta hoon 🙂 Jagahon, stays, safari, kharche ya din-ba-din plan mein madad kar sakta hoon."],
 ["Eta amar kajer baire, ami shudhu Dooars trip planning-e sahajyo kori 🙂 Jayga, stay, safari, khoroch ba din-wari plan-e sahajyo korte pari."],
 {act:'scope',next:['plan','besttime','price']});
T('later','will think|let me think|i will think|i\'ll think|will see|sochke bataunga|sochke bataungi|sochke batayenge|sochke batati|soch ke bataunga|soch ke bataungi|soch lete|baad mein baat|baad me baat|pore bolbo|pore janabo|bhebe dekhi|bhebe bolbo|vebe dekhi|vebe bolbo|not now|maybe later|abhi nahi|ekhon na|ভেবে দেখি|পরে বলব|सोचकर बताऊंगा|सोचकर बताती|बाद में बात',
 ["No problem at all 🙂 Take your time. I'm here whenever you want to look at it again, and your plan stays right here."],
 ["Koi baat nahi 🙂 Aaram se soch lijiye. Jab chahein wapas aaiye, aapka plan yahin rahega."],
 ["Kono byapar na 🙂 Aste bhebe nin. Jokhon iccha firey ashben, apnar plan ekhanei thakbe."],
 {next:['plan','human'],act:'no'});
T('nope','no|nope|nah|not interested|no thanks|no thank you|nahi|nahin|nai|na|nahi chahiye|interested nahi|dorkar nei|দরকার নেই|नहीं|नहीं चाहिए',
 ["No problem at all 🙂 Take your time. I'm here whenever you want to look at it again, and your plan stays right here."],
 ["Koi baat nahi 🙂 Aaram se soch lijiye. Jab chahein wapas aaiye, aapka plan yahin rahega."],
 ["Kono byapar na 🙂 Aste bhebe nin. Jokhon iccha firey ashben, apnar plan ekhanei thakbe."],
 {short:true,next:['plan','human'],act:'no'});
T('yes','yes|yeah|yep|yup|sure|ya|haan|han|ha|ji haan|ji|haan ji|theek hai chalo|chalo|hya|hyan|hoon|ha chai|হ্যাঁ|হাঁ|জি|হ্যা|हाँ|हां|जी|जी हाँ',
 ["Great! 🙂"],["Badhiya! 🙂"],["Darun! 🙂"],{short:true,act:'yes'});

/* ---------- planner trigger ---------- */
T('plan','plan|plan my trip|plan a trip|itinerary|trip plan|tour plan|plan banao|plan bana do|plan karo|plan chahiye|itinerary chahiye|trip banao|trip plan karo|ghoomne ka plan|plan koro|plan korun|plan banan|plan chai|plan banai|trip korte chai|ghurte chai|ghoomna hai|ghoomne jana|ghoomne jaana|घूमने का प्लान|प्लान|ট্রিপ|প্ল্যান|ঘুরতে চাই|suggest a trip|suggest itinerary|day plan|program|programme',
 [],[],[],{act:'plan'});

/* ---------- extra Devanagari and Bangla script phrases (what voice input and script typing produce) ---------- */
(()=>{const add=(id,l)=>{const it=INTENTS.find(x=>x.id===id);if(it)it.kw.push(...l.toLowerCase().split('|').map(s=>s.trim()).filter(Boolean))};
add('greet','नमस्ते|नमस्कार|हेलो|हाय|নমস্কার|হ্যালো|হাই');
add('besttime','कब जाना|कब जाएं|कब जाएँ|सबसे अच्छा समय|कौन सा महीना|कौन से महीने|कब घूमने|কখন যাব|কবে যাব|কোন মাসে|ভালো সময়|সেরা সময়|কোন সময়|কখন যাওয়া ভালো');
add('monsoon','बारिश|बरसात|मानसून|पार्क बंद|বৃষ্টি|বর্ষা|পার্ক বন্ধ');
add('reach','कैसे पहुंच|कैसे पहुँच|कैसे जाएं|कैसे जाना|कैसे जाऊं|स्टेशन|एयरपोर्ट|ट्रेन|फ्लाइट|কীভাবে যাব|কিভাবে যাব|কীভাবে যেতে|কিভাবে যেতে|স্টেশন|এয়ারপোর্ট|ট্রেন|ফ্লাইট');
add('kolkata','कोलकाता से|कोलकाता|কলকাতা থেকে|কলকাতা');
add('days','कितने दिन|कितने दिनों|কত দিন|কয় দিন|কতদিন|কয়দিন');
add('safari','सफारी|जीप सफारी|সাফারি|জিপ সাফারি');
add('sighting','दिखेगा|दिखेंगे|দেখা যাবে|দেখতে পাব|গন্ডার দেখা|बाघ दिखेगा');
add('jaldapara','जलदापाड़ा|गैंडा|জলদাপাড়া|গন্ডার');
add('gorumara','गोरुमारा|लटागुड़ी|গোরুমারা|লাটাগুড়ি');
add('buxa','बक्सा|जयंती|ट्रेक|বক্সা|জয়ন্তী|ট্রেক');
add('tea','चाय बागान|चाय के बागान|চা বাগান');
add('things','क्या देखें|घूमने की जगह|क्या क्या देखने|क्या करें|কী কী দেখব|ঘোরার জায়গা|কি কি দেখার|কী করব');
add('bhutan','भूटान|ভুটান');
add('weather','मौसम|ठंड|गर्मी|আবহাওয়া|শীত|গরম');
add('packing','क्या ले जाएं|क्या ले जाएँ|क्या पहनें|কী নিয়ে যাব|কি নিয়ে যাব|কী পরব');
add('stay','कहाँ रुकें|कहां रुकें|रुकने|होटल|रिसॉर्ट|কোথায় থাকব|থাকার জায়গা|হোটেল|রিসোর্ট');
add('homestay','होमस्टे|হোমস্টে');
add('food','खाना|खाने|খাবার|খাওয়া');
add('veg','शाकाहारी|वेज|নিরামিষ|ভেজ');
add('family','बच्चे|बच्चों|परिवार|বাচ্চা|পরিবার');
add('elderly','बुजुर्ग|বয়স্ক|বৃদ্ধ');
add('honeymoon','हनीमून|হানিমুন');
add('solo','अकेला|अकेले|अकेली|একা');
add('safety','सुरक्षित|सेफ|নিরাপদ|সেফ');
add('group','ग्रुप|दोस्त|দল|বন্ধু');
add('price','कितना खर्च|कितना खर्चा|कितना लगेगा|कितने का|खर्चा|रेट|कीमत|दाम|দাম কত|কত খরচ|কত টাকা|খরচ|কত লাগবে');
add('expensive','महंगा|ज़्यादा है|सस्ता|बजट कम|বেশি দাম|দাম বেশি|সস্তা|বাজেট কম');
add('discount','छूट|डिस्काउंट|কম করো|ছাড়|ডিসকাউন্ট');
add('payment','पेमेंट|रिफंड|कैंसल|পেমেন্ট|রিফান্ড|ক্যানসেল');
add('booking','बुक|बुकिंग|বুক|বুকিং|कोटेशन');
add('human','इंसान|कॉल|नंबर दो|टीम से|ফোন|কল করুন|মানুষ|টিমের সাথে');
add('thanks','धन्यवाद|शुक्रिया|ধন্যবাদ');
add('bye','अलविदा|বিদায়');
add('plan','प्लान|घूमने का प्लान|यात्रा|ট্রিপ|প্ল্যান|ঘুরতে চাই|ঘুরতে যেতে চাই');
add('later','सोचकर बताऊंगा|सोचकर बताती|ভেবে দেখি|পরে বলব');
add('scope','राजनीति|चुनाव|विधायक|सांसद|मंत्री|सरकार|রাজনীতি|নির্বাচন|ভোট|বিধায়ক|সাংসদ');
})();

/* ---------- formal tone layer: courteous English, no emoji (overrides the earlier drafts above) ---------- */
(()=>{
const EN={
greet:["Hello, and welcome. I am the GoDooars trip assistant.","How may I help you today? You may ask a question or choose an option below."],
thanks:["You are welcome. Is there anything else I can help you with?"],
bye:["Thank you for your time. Please feel free to return whenever you wish."],
wow:["I am glad to hear that. Would you like me to prepare a trip plan for you?"],
ok:["Noted. Is there anything else I can help you with?"],
confused:["My apologies. Let me put it more simply.","You may ask about the *best time*, *cost*, *how to reach*, or request a *3-day plan*."],
identity:["I am a virtual assistant for Dooars trips. I can answer most questions and prepare a plan. For bookings and exact prices, a member of our team will assist you."],
besttime:["The best time to visit is October to March, when the weather is cool and dry and safaris are at their best.","April is also suitable, especially for birdwatching. From June to mid-September it is the rainy season and the main parks remain closed, although the tea gardens and villages are green and quiet."],
monsoon:["Gorumara and Jaldapara are usually closed from about 16 June to 15 September for the monsoon.","Tea gardens, rivers and village stays remain open, so I can plan a peaceful trip around the closure. Exact dates may change, so please confirm before booking."],
reach:["The simplest way is to travel by air or train to *Bagdogra airport* or *New Jalpaiguri (NJP)*, followed by a 2 to 3 hour road journey into the Dooars.","For Jaldapara or Buxa, Alipurduar and Hasimara stations are closer. May I ask where you will be travelling from?"],
kolkata:["From Kolkata, you may take the overnight *Kanchan Kanya Express* from Sealdah to Alipurduar (about 16 hours), or a train to NJP (the Vande Bharat takes about 7.5 hours) followed by a car.","A flight to Bagdogra is quicker if time is limited. Train timings change, so please check the latest schedule when booking. Would you like me to plan the trip?"],
days:["Three nights and four days is ideal for the Dooars. Two days would feel rushed because of the road journey from Bagdogra or NJP.","With five days or more, Buxa and the Bhutan border can also be included. Shall I prepare a plan for you?"],
safari:["Jeep safaris operate in Gorumara and Jaldapara, and Jaldapara also offers elephant safaris.","Slots are limited, so early booking is advised in the peak season (November to February). Jaldapara has recently introduced online booking. A jeep typically costs about ₹2,500 to ₹4,500 per trip and an elephant ride about ₹1,000 to ₹1,500 per person. These figures are approximate, and our team will confirm the exact fees."],
sighting:["I must be honest: no one can guarantee a wildlife sighting, as these are wild forests.","Jaldapara offers the best chance of seeing rhinos, as it has the second largest rhino population in India after Kaziranga. Early morning safaris are usually the best. Tigers are rarely seen here."],
jaldapara:["Jaldapara is known for the one-horned rhino. It is a large park of about 216 sq km with jeep and elephant safaris, and Hollong or Madarihat is the usual base.","I would suggest staying at least one night nearby so that you can take an early morning safari."],
gorumara:["Gorumara is smaller, at about 80 sq km, with dense forest, watchtowers, and sightings of rhino, elephants, bison and many birds.","Lataguri is the usual base, and jeep safaris run twice a day. Murti is quieter, and Chalsa is somewhat more upscale."],
compare:["Both are excellent but different. Gorumara is smaller and denser, with watchtowers. Jaldapara is larger with open grassland and is known for rhinos and elephant safaris.","With three or more days, I would suggest visiting both. If you have time for only one, choose Jaldapara for rhinos or Gorumara for forest and birds. The Dooars is plains, forest and tea, whereas Darjeeling and Sikkim are mountains, so the choice depends on your preference."],
buxa:["Buxa and Jayanti are quieter and more adventurous, with river-bed walks, forest trails and a trek to Buxa Fort (roughly a 2-hour walk from Santalabari).","This suits those who prefer fewer crowds. The trek is of moderate difficulty and is not ideal for very young children or elderly travellers."],
samsing:["Samsing and Suntalekhola are peaceful villages at the edge of the hills, with tea gardens, rivers and short forest walks. Rocky Island, near Murti, is popular for sunsets, camping and stargazing.","They suit a slow, relaxed day. Mobile network may be weak in some places."],
tea:["Tea garden walks are among the most pleasant experiences in the Dooars. The Chalsa and Samsing side has many estates.","Some estates permit walks and tastings, but access varies, so we arrange visits in advance."],
things:["The Dooars offers jeep and elephant safaris, tea garden walks, river-bed picnics at Murti, birdwatching, a trek to Buxa Fort, village stays, and a day trip to the Bhutan border.","Please tell me what you enjoy (wildlife, nature or adventure), and I will select the best options for your days."],
bhutan:["A day trip to the Jaigaon and Phuentsholing border town is possible from the eastern Dooars. Indian visitors do not need a visa but must carry a valid photo ID, and travel beyond the border town requires a permit.","Rules change often, so our team confirms the latest requirements before you travel."],
totopara:["Totopara is a very small village of the Toto community near the Bhutan border. The road can be rough, with river crossings that may be impassable during the rains.","Visits may require prior permission, so I would prefer that our team verify the current rules for your dates rather than guess. Shall I ask them to look into it?"],
weather:["Winter (November to February) is pleasant and cool, with foggy and chilly mornings. Summer is warm and humid, and the monsoon (June to September) brings heavy rain.","A light jacket is advisable for winter evenings."],
packing:["Light cotton clothing or layers, a jacket in winter, comfortable walking shoes, a hat, sunscreen, a torch and a photo ID.","For safaris, muted colours such as green, brown and grey are preferable to bright ones. A raincoat is advisable between June and September."],
network:["Mobile network is weak in some places such as Murti and Ramsai, and small villages may not have ATMs or UPI, so please carry some cash.","Larger towns and most resorts are not affected."],
language:["Bengali is the main language, and Sadri, Nepali and Hindi are also widely spoken. Guides and hotels manage well in Hindi and English."],
stay:["There are three kinds of accommodation: forest lodges and eco-cottages run by the state, private resorts and hotels (mostly around Lataguri, Chalsa and Madarihat), and simple village homestays.","Please tell me your budget and who is travelling, and I will suggest a suitable option."],
homestay:["Homestays offer a good view of village life, with simple rooms, home-cooked food and warm hospitality. They are usually the most economical option as well.","I can include one in your plan if you wish."],
food:["You can expect home-style Bengali food along with local tribal and Rajbanshi dishes, such as rice, river fish, greens and bamboo shoot.","Meals are usually provided by your stay, so you will not need to search for restaurants. Please mention any preferences at the time of booking."],
veg:["Vegetarian food is usually easy to find at resorts and homestays. Please mention it when booking so that they can prepare in advance. Jain or strict vegan meals need advance notice."],
family:["Yes, the Dooars is suitable for children. Safaris, tea gardens and river picnics are enjoyed by most children.","I would suggest keeping road journeys under about 3 hours a day and carrying snacks and sun protection. Shall I plan a family trip?"],
elderly:["In most cases, yes. I would suggest fewer stops, a stay close to the park (Lataguri or Hollong), and avoiding treks such as Buxa Fort. Jeep safaris are manageable, although the ride can be bumpy.","Please tell me about your group, and I will keep the plan comfortable."],
honeymoon:["The Dooars makes a quiet and pleasant honeymoon destination, with forest resorts, river views, tea gardens and starry evenings. It offers peace and nature rather than nightlife.","Would you like a plan suited to couples? I will select a suitable resort and a relaxed pace."],
solo:["Many solo travellers visit, and the region is generally calm. Please choose a reliable stay, avoid travelling on forest roads late at night, and share your plan with someone at home.","If you share your dates, I can suggest well-run stays for solo travellers."],
safety:["The Dooars is generally calm and welcoming to tourists. The main precaution concerns wildlife: please do not walk alone in forest areas, do not stop on forest roads at night (elephants cross them), and follow your guide's instructions.","Stay at a reliable place and travel on forest roads in daylight."],
group:["Yes, we can plan for groups. Larger groups need earlier booking, as safari slots and rooms are limited.","May I know how many people will be travelling, and in which month?"],
price:["As a rough guide for 3 nights and 4 days, per person: budget about ₹6,000 to ₹6,500, mid-range about ₹9,000 to ₹10,000, and comfortable or premium resorts from about ₹15,000.","This usually excludes travel to Bagdogra or NJP, and safari tickets are often extra. For an exact quote, I would need your dates and group size."],
expensive:["I understand. The cost can be reduced by staying in a homestay, travelling outside the peak season (March, or after the monsoon), or shortening the trip by a day.","Would you like me to revise the plan for a lower budget?"],
discount:["I am unable to change prices myself, but our team can look for the best option for your dates and group size. Shall I note your details so that they can contact you?"],
payment:["Payment and cancellation terms are handled by our team so that everything is clear and in writing. I am unable to quote them myself. Shall I take your details so that they can call you?"],
booking:["Certainly. I am unable to confirm bookings myself, but a member of our team will take this forward."],
human:["Certainly. I am alerting a member of our team. In a live setup, they receive a notification and continue in this same chat.","May I take your name and number so that they can contact you directly?"],
complaint:["I am sorry to hear that. I do not want to guess, so I will ask a member of our team to look into it promptly."],
emergency:["I am unable to assist with medical, legal or emergency matters. If anyone is in danger, please call *112* (India's emergency number) immediately, or contact a local doctor or hospital."],
scope:["That is outside what I can assist with, as I only help with Dooars trip planning. I would be glad to help with places, stays, safaris, costs or a day-by-day plan."],
later:["Certainly. Please take your time. You are welcome to return whenever you wish, and your plan will remain here."],
nope:["Certainly. Please take your time. You are welcome to return whenever you wish, and your plan will remain here."],
yes:["Certainly."]
};
/* Hindi and Bengali (Roman): same polite register, a few chatty lines made formal */
const HB={
yes:{hi:["Theek hai."],bn:["Thik ache."]},
wow:{hi:["Yeh jaankar achha laga. Kya main aapke liye ek plan taiyar karoon?"],bn:["Eta shune bhalo laglo. Ami ki apnar jonno ekta plan toiri korbo?"]},
sighting:{hi:["Spasht roop se kahoon to, koi bhi sighting ki guarantee nahi de sakta, kyunki ye jungle hai. Main jhoothi umeed nahi dena chahta.","Rhino ke liye Jaldapara sabse achha hai (Kaziranga ke baad India mein sabse zyada rhino yahin hain). Subah ki safari aam taur par best hoti hai. Tiger yahan bahut kam dikhte hain."],bn:["Sposhto kore bolle, keu sighting-er guarantee dite pare na, karon eta jongol. Ami mithye ashwas dite chai na.","Rhino dekhar jonno Jaldapara sobcheye bhalo (Kaziranga-r por Bharote sobcheye beshi rhino ekhane). Bhor-er safari sadharonoto bhalo. Bagh ekhane khub kom dekha jay."]},
compare:{hi:["Dono achhe hain, lekin alag. Gorumara chhota aur ghana hai, watchtowers ke saath. Jaldapara bada aur khula ghaas ka maidan hai, rhino aur elephant safari ke liye jaana jaata hai.","3 din ya zyada hon to dono dekhna uchit rahega. Ek hi chunna ho to rhino ke liye Jaldapara, jungle aur birds ke liye Gorumara. Dooars maidan, jungle aur chai ka ilaka hai, jabki Darjeeling aur Sikkim pahad hain, isliye ye aapki pasand par nirbhar karta hai."],bn:["Dutoi bhalo, kintu alada. Gorumara chhoto ar ghono, watchtower ache. Jaldapara boro, khola ghaser mathh, rhino ar elephant safari-r jonno bikhyato.","3 din ba beshi hole dutoi dekha uchit. Ekta bachte hole rhino-r jonno Jaldapara, jongol ar pakhir jonno Gorumara. Dooars somotol, jongol ar chaa-er elaka, kintu Darjeeling ar Sikkim pahar, tai eta apnar pochondo-er upor nirbhor kore."]},
family:{hi:["Ji haan, Dooars bachchon ke saath bhi upyukt hai. Safari, chai bagan aur nadi ke kinare picnic bachchon ko aam taur par pasand aate hain.","Din mein 3 ghante se kam drive rakhne aur snacks tatha sunscreen saath rakhne ki salah dunga. Kya main family trip plan karoon?"],bn:["Hya, Dooars bachchader sathe-o upojogi. Safari, chaa-bagan ar nodir dhare picnic bachchader sadharonoto bhalo lage.","Diney 3 ghontar kom gari rakhte ar snack, sunscreen niye nite boli. Ami ki family trip-er plan kori?"]},
group:{hi:["Ji haan, groups ke liye bhi plan taiyar ho jaata hai. Bade groups ke liye pehle se booking zaroori hai, kyunki safari slots aur rooms seemit hote hain.","Kripya bataiye, aap kitne log hain aur kaun sa mahina?"],bn:["Hya, group-er jonno-o plan hoy. Boro group-er age theke booking dorkar, karon safari slot ar room simito.","Doya kore bolun, apnara koyjon ar kon mas?"]}
};
const EMO=/\s?[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}]+\s?/gu;
/* an emoji that sat between two sentences becomes a full stop; one at the end simply disappears */
const noEmoji=t=>t.replace(EMO,(m,off,str)=>{const next=str.slice(off+m.length);if(!next)return '';const prev=str[off-1]||'';return /[.!?:;,]/.test(prev)?' ':'. '}).replace(/\s+([.,!?])/g,'$1').trim();
INTENTS.forEach(it=>{
  if(EN[it.id])it.r.en=EN[it.id];
  if(HB[it.id])Object.assign(it.r,HB[it.id]);
  ['en','hi','bn'].forEach(l=>{it.r[l]=(it.r[l]||[]).map(noEmoji)});
});
})();
