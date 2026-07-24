import type { Cuisine } from '@/lib/types';

/** Sixteen cuisines with cultural context, used by the explore page and the World Cuisine agent. */
export const CUISINES: Cuisine[] = [
  {
    id: 'romanian',
    flag: '🇷🇴',
    emoji: '🥘',
    gradient: ['#f5b942', '#d94f2b'],
    name: { ro: 'Românească', ru: 'Румынская', en: 'Romanian' },
    description: {
      ro: 'Bucătărie de familie, cu ciorbe acrite cu borș, tocănițe lente și preparate de sărbătoare.',
      ru: 'Домашняя кухня с кислыми супами, тушёными блюдами и праздничными рецептами.',
      en: 'Homely cooking built on sour soups, slow stews and festive dishes.',
    },
    staples: {
      ro: ['Mălai', 'Smântână', 'Varză murată', 'Mărar', 'Carne de porc', 'Borș'],
      ru: ['Кукурузная мука', 'Сметана', 'Квашеная капуста', 'Укроп', 'Свинина', 'Борщевая закваска'],
      en: ['Cornmeal', 'Sour cream', 'Sauerkraut', 'Dill', 'Pork', 'Fermented bran sour'],
    },
    signatureDishes: [
      {
        name: 'Sarmale',
        note: {
          ro: 'Rulouri de varză cu carne tocată, gătite lent ore întregi.',
          ru: 'Голубцы из квашеной капусты с фаршем, томлёные несколько часов.',
          en: 'Cabbage rolls with minced meat, simmered slowly for hours.',
        },
      },
      {
        name: 'Mămăligă',
        note: {
          ro: 'Terci de mălai servit cu brânză, smântână și ou.',
          ru: 'Кукурузная каша с брынзой, сметаной и яйцом.',
          en: 'Cornmeal polenta served with cheese, sour cream and egg.',
        },
      },
      {
        name: 'Ciorbă de burtă',
        note: {
          ro: 'Ciorbă albă, dreasă cu smântână și usturoi.',
          ru: 'Белый суп со сметаной и чесноком.',
          en: 'Creamy tripe soup finished with sour cream and garlic.',
        },
      },
      {
        name: 'Papanași',
        note: {
          ro: 'Gogoși de brânză cu smântână și dulceață de afine.',
          ru: 'Творожные пончики со сметаной и черничным вареньем.',
          en: 'Cheese doughnuts with sour cream and blueberry jam.',
        },
      },
    ],
  },
  {
    id: 'moldovan',
    flag: '🇲🇩',
    emoji: '🥟',
    gradient: ['#f2c14e', '#3f8f5f'],
    name: { ro: 'Moldovenească', ru: 'Молдавская', en: 'Moldovan' },
    description: {
      ro: 'Plăcinte, zeamă de pui și mese lungi cu vin de casă — ospitalitate în forma ei cea mai directă.',
      ru: 'Плацинды, куриная зама и долгие застолья с домашним вином.',
      en: 'Savoury pies, chicken zeamă and long tables with homemade wine.',
    },
    staples: {
      ro: ['Brânză de oi', 'Mărar', 'Mălai', 'Roșii', 'Usturoi', 'Vin de casă'],
      ru: ['Овечья брынза', 'Укроп', 'Кукурузная мука', 'Помидоры', 'Чеснок', 'Домашнее вино'],
      en: ['Sheep cheese', 'Dill', 'Cornmeal', 'Tomatoes', 'Garlic', 'Homemade wine'],
    },
    signatureDishes: [
      {
        name: 'Plăcinte',
        note: {
          ro: 'Foi subțiri umplute cu brânză, cartofi sau varză.',
          ru: 'Тонкие лепёшки с брынзой, картофелем или капустой.',
          en: 'Thin pastries filled with cheese, potato or cabbage.',
        },
      },
      {
        name: 'Zeamă',
        note: {
          ro: 'Supă de pui cu tăieței de casă, acrită cu borș.',
          ru: 'Куриный суп с домашней лапшой и кислинкой.',
          en: 'Chicken soup with homemade noodles and a sour finish.',
        },
      },
      {
        name: 'Mititei',
        note: {
          ro: 'Rulouri de carne condimentate, la grătar.',
          ru: 'Пряные мясные колбаски на гриле.',
          en: 'Spiced grilled minced-meat rolls.',
        },
      },
      {
        name: 'Mucenici',
        note: {
          ro: 'Aluat dulce în formă de opt, cu nucă și miere.',
          ru: 'Сладкое тесто в форме восьмёрки с орехами и мёдом.',
          en: 'Figure-eight sweet dough with walnuts and honey.',
        },
      },
    ],
  },
  {
    id: 'russian',
    flag: '🇷🇺',
    emoji: '🥣',
    gradient: ['#6f8fd6', '#c94f4f'],
    name: { ro: 'Rusă', ru: 'Русская', en: 'Russian' },
    description: {
      ro: 'Supe consistente, aluaturi umplute și mese de sărbătoare cu multe gustări reci.',
      ru: 'Сытные супы, изделия из теста с начинкой и щедрые закуски.',
      en: 'Hearty soups, filled doughs and generous tables of cold zakuski.',
    },
    staples: {
      ro: ['Smântână', 'Sfeclă', 'Mărar', 'Hrean', 'Făină', 'Castraveți murați'],
      ru: ['Сметана', 'Свёкла', 'Укроп', 'Хрен', 'Мука', 'Солёные огурцы'],
      en: ['Sour cream', 'Beetroot', 'Dill', 'Horseradish', 'Flour', 'Pickled cucumbers'],
    },
    signatureDishes: [
      {
        name: 'Pelmeni',
        note: {
          ro: 'Găluște siberiene cu carne, servite cu smântână.',
          ru: 'Сибирские пельмени с мясом, подаются со сметаной.',
          en: 'Siberian meat dumplings served with sour cream.',
        },
      },
      {
        name: 'Borș / Борщ',
        note: {
          ro: 'Supă de sfeclă cu varză, cu rădăcini est-europene comune.',
          ru: 'Свекольный суп с капустой, общий для Восточной Европы.',
          en: 'Beetroot and cabbage soup shared across Eastern Europe.',
        },
      },
      {
        name: 'Salată Olivier',
        note: {
          ro: 'Salată de cartofi cu maioneză, nelipsită de Anul Nou.',
          ru: 'Картофельный салат с майонезом — символ Нового года.',
          en: 'Mayonnaise potato salad, the New Year classic.',
        },
      },
      {
        name: 'Blini',
        note: {
          ro: 'Clătite subțiri servite dulci sau sărate.',
          ru: 'Тонкие блины со сладкой или солёной начинкой.',
          en: 'Thin pancakes served sweet or savoury.',
        },
      },
      {
        name: 'Syrniki',
        note: {
          ro: 'Turte de brânză de vaci, prăjite scurt.',
          ru: 'Творожные сырники, обжаренные до румяности.',
          en: 'Pan-fried farmer-cheese patties.',
        },
      },
      {
        name: 'Medovik',
        note: {
          ro: 'Tort cu foi de miere și cremă de smântână.',
          ru: 'Медовый торт со сметанным кремом.',
          en: 'Honey layer cake with sour-cream frosting.',
        },
      },
    ],
  },
  {
    id: 'italian',
    flag: '🇮🇹',
    emoji: '🍝',
    gradient: ['#e34f4f', '#2f9e5f'],
    name: { ro: 'Italiană', ru: 'Итальянская', en: 'Italian' },
    description: {
      ro: 'Puține ingrediente, dar de calitate: paste, roșii, ulei de măsline și brânzeturi.',
      ru: 'Мало ингредиентов, но лучших: паста, томаты, оливковое масло и сыры.',
      en: 'Few ingredients, chosen well: pasta, tomatoes, olive oil and cheese.',
    },
    staples: {
      ro: ['Ulei de măsline', 'Parmezan', 'Busuioc', 'Roșii San Marzano', 'Paste', 'Usturoi'],
      ru: ['Оливковое масло', 'Пармезан', 'Базилик', 'Томаты Сан-Марцано', 'Паста', 'Чеснок'],
      en: ['Olive oil', 'Parmesan', 'Basil', 'San Marzano tomatoes', 'Pasta', 'Garlic'],
    },
    signatureDishes: [
      {
        name: 'Pizza Margherita',
        note: {
          ro: 'Napoletană: roșii, mozzarella, busuioc.',
          ru: 'Неаполитанская: томаты, моцарелла, базилик.',
          en: 'Neapolitan: tomato, mozzarella, basil.',
        },
      },
      {
        name: 'Carbonara',
        note: {
          ro: 'Guanciale, ou, pecorino — fără smântână.',
          ru: 'Гуанчале, яйцо, пекорино — без сливок.',
          en: 'Guanciale, egg, pecorino — never cream.',
        },
      },
      {
        name: 'Risotto',
        note: {
          ro: 'Orez Arborio gătit lent, cu supă adăugată treptat.',
          ru: 'Рис арборио, медленно доведённый бульоном.',
          en: 'Arborio rice brought up slowly with stock.',
        },
      },
      {
        name: 'Tiramisu',
        note: {
          ro: 'Mascarpone, cafea și pișcoturi, fără coacere.',
          ru: 'Маскарпоне, кофе и савоярди без выпечки.',
          en: 'Mascarpone, coffee and savoiardi, no baking.',
        },
      },
    ],
  },
  {
    id: 'french',
    flag: '🇫🇷',
    emoji: '🥐',
    gradient: ['#6b7fd6', '#e0b0c8'],
    name: { ro: 'Franceză', ru: 'Французская', en: 'French' },
    description: {
      ro: 'Tehnică precisă, sosuri construite cu răbdare și patiserie de manual.',
      ru: 'Точная техника, терпеливо построенные соусы и эталонная выпечка.',
      en: 'Precise technique, patiently built sauces and textbook pastry.',
    },
    staples: {
      ro: ['Unt', 'Cimbru', 'Vin alb', 'Șalotă', 'Smântână grasă', 'Brânzeturi'],
      ru: ['Сливочное масло', 'Тимьян', 'Белое вино', 'Шалот', 'Сливки', 'Сыры'],
      en: ['Butter', 'Thyme', 'White wine', 'Shallot', 'Cream', 'Cheese'],
    },
    signatureDishes: [
      {
        name: 'Ratatouille',
        note: {
          ro: 'Legume de vară din Provence, gătite încet.',
          ru: 'Летние овощи Прованса, томлёные медленно.',
          en: 'Provençal summer vegetables, slowly cooked.',
        },
      },
      {
        name: 'Coq au vin',
        note: {
          ro: 'Pui gătit în vin roșu cu ciuperci și bacon.',
          ru: 'Курица в красном вине с грибами и беконом.',
          en: 'Chicken braised in red wine with mushrooms and bacon.',
        },
      },
      {
        name: 'Quiche Lorraine',
        note: {
          ro: 'Tartă sărată cu ou, smântână și afumătură.',
          ru: 'Солёный тарт с яйцом, сливками и копчёностями.',
          en: 'Savoury tart with egg, cream and smoked pork.',
        },
      },
      {
        name: 'Crème brûlée',
        note: {
          ro: 'Cremă de vanilie cu crustă de zahăr ars.',
          ru: 'Ванильный крем с карамельной корочкой.',
          en: 'Vanilla custard under burnt sugar.',
        },
      },
    ],
  },
  {
    id: 'mexican',
    flag: '🇲🇽',
    emoji: '🌮',
    gradient: ['#e8622c', '#3f9e4d'],
    name: { ro: 'Mexicană', ru: 'Мексиканская', en: 'Mexican' },
    description: {
      ro: 'Porumb, ardei iuți și lime — arome directe, construite pe tortilla.',
      ru: 'Кукуруза, перец чили и лайм — яркие вкусы на основе тортильи.',
      en: 'Corn, chillies and lime — bright flavours built on the tortilla.',
    },
    staples: {
      ro: ['Tortilla de porumb', 'Lime', 'Coriandru', 'Fasole neagră', 'Ardei jalapeño', 'Avocado'],
      ru: ['Кукурузная тортилья', 'Лайм', 'Кинза', 'Чёрная фасоль', 'Халапеньо', 'Авокадо'],
      en: ['Corn tortilla', 'Lime', 'Cilantro', 'Black beans', 'Jalapeño', 'Avocado'],
    },
    signatureDishes: [
      {
        name: 'Tacos al pastor',
        note: {
          ro: 'Carne marinată cu ananas, tăiată de pe rotisor.',
          ru: 'Маринованное мясо с ананасом с вертела.',
          en: 'Spit-roasted marinated pork with pineapple.',
        },
      },
      {
        name: 'Guacamole',
        note: {
          ro: 'Avocado zdrobit cu lime, ceapă și coriandru.',
          ru: 'Пюре из авокадо с лаймом, луком и кинзой.',
          en: 'Mashed avocado with lime, onion and cilantro.',
        },
      },
      {
        name: 'Enchiladas',
        note: {
          ro: 'Tortilla rulate, coapte în sos de chili.',
          ru: 'Свёрнутые тортильи, запечённые в соусе чили.',
          en: 'Rolled tortillas baked in chilli sauce.',
        },
      },
      {
        name: 'Pozole',
        note: {
          ro: 'Supă groasă cu porumb hominy și carne.',
          ru: 'Густой суп с кукурузой хомини и мясом.',
          en: 'Thick hominy and meat soup.',
        },
      },
    ],
  },
  {
    id: 'japanese',
    flag: '🇯🇵',
    emoji: '🍣',
    gradient: ['#d15f6f', '#4b6fa8'],
    name: { ro: 'Japoneză', ru: 'Японская', en: 'Japanese' },
    description: {
      ro: 'Sezonalitate, echilibru și respect pentru ingredientul simplu.',
      ru: 'Сезонность, баланс и уважение к простому продукту.',
      en: 'Seasonality, balance and respect for the simple ingredient.',
    },
    staples: {
      ro: ['Orez', 'Sos de soia', 'Miso', 'Alge nori', 'Ghimbir', 'Dashi'],
      ru: ['Рис', 'Соевый соус', 'Мисо', 'Нори', 'Имбирь', 'Даси'],
      en: ['Rice', 'Soy sauce', 'Miso', 'Nori', 'Ginger', 'Dashi'],
    },
    signatureDishes: [
      {
        name: 'Miso shiru',
        note: {
          ro: 'Supă miso — parte din micul dejun tradițional.',
          ru: 'Мисо-суп — часть традиционного завтрака.',
          en: 'Miso soup — part of the traditional breakfast.',
        },
      },
      {
        name: 'Sushi',
        note: {
          ro: 'Orez oțetit cu pește sau legume.',
          ru: 'Рис с уксусом, рыбой или овощами.',
          en: 'Vinegared rice with fish or vegetables.',
        },
      },
      {
        name: 'Ramen',
        note: {
          ro: 'Supă cu tăieței, sute de variante regionale.',
          ru: 'Суп с лапшой, сотни региональных версий.',
          en: 'Noodle soup with hundreds of regional versions.',
        },
      },
      {
        name: 'Tamagoyaki',
        note: {
          ro: 'Omletă rulată, ușor dulce.',
          ru: 'Свёрнутый слегка сладкий омлет.',
          en: 'Rolled, lightly sweet omelette.',
        },
      },
    ],
  },
  {
    id: 'chinese',
    flag: '🇨🇳',
    emoji: '🥢',
    gradient: ['#d64545', '#e0a63f'],
    name: { ro: 'Chinezească', ru: 'Китайская', en: 'Chinese' },
    description: {
      ro: 'Opt mari tradiții regionale, de la sichuanez iute la cantonez delicat.',
      ru: 'Восемь региональных традиций — от острой сычуаньской до нежной кантонской.',
      en: 'Eight regional traditions, from fiery Sichuan to delicate Cantonese.',
    },
    staples: {
      ro: ['Sos de soia', 'Ghimbir', 'Ceapă verde', 'Ulei de susan', 'Oțet de orez', 'Piper Sichuan'],
      ru: ['Соевый соус', 'Имбирь', 'Зелёный лук', 'Кунжутное масло', 'Рисовый уксус', 'Сычуаньский перец'],
      en: ['Soy sauce', 'Ginger', 'Spring onion', 'Sesame oil', 'Rice vinegar', 'Sichuan pepper'],
    },
    signatureDishes: [
      {
        name: 'Mapo tofu',
        note: {
          ro: 'Tofu în sos iute de fasole fermentată.',
          ru: 'Тофу в остром соусе из ферментированных бобов.',
          en: 'Tofu in spicy fermented bean sauce.',
        },
      },
      {
        name: 'Dim sum',
        note: {
          ro: 'Gustări cantoneze la abur, servite la ceai.',
          ru: 'Кантонские закуски на пару к чаю.',
          en: 'Cantonese steamed bites served with tea.',
        },
      },
      {
        name: 'Kung Pao',
        note: {
          ro: 'Pui sotat cu arahide și chili uscat.',
          ru: 'Курица с арахисом и сушёным чили.',
          en: 'Stir-fried chicken with peanuts and dried chilli.',
        },
      },
    ],
  },
  {
    id: 'korean',
    flag: '🇰🇷',
    emoji: '🍲',
    gradient: ['#d1495b', '#3a86a8'],
    name: { ro: 'Coreeană', ru: 'Корейская', en: 'Korean' },
    description: {
      ro: 'Fermentare, echilibru între iute și dulce, și multe garnituri mici (banchan).',
      ru: 'Ферментация, баланс острого и сладкого и множество закусок панчхан.',
      en: 'Fermentation, sweet-hot balance and a spread of small banchan.',
    },
    staples: {
      ro: ['Gochujang', 'Kimchi', 'Ulei de susan', 'Orez', 'Usturoi', 'Sos de soia'],
      ru: ['Кочхуджан', 'Кимчи', 'Кунжутное масло', 'Рис', 'Чеснок', 'Соевый соус'],
      en: ['Gochujang', 'Kimchi', 'Sesame oil', 'Rice', 'Garlic', 'Soy sauce'],
    },
    signatureDishes: [
      {
        name: 'Bibimbap',
        note: {
          ro: 'Bol de orez cu legume, ou și gochujang.',
          ru: 'Рис с овощами, яйцом и кочхуджаном.',
          en: 'Rice bowl with vegetables, egg and gochujang.',
        },
      },
      {
        name: 'Kimchi jjigae',
        note: {
          ro: 'Tocană acrișoară cu kimchi fermentat.',
          ru: 'Кисловатое рагу с выдержанным кимчи.',
          en: 'Tangy stew built on aged kimchi.',
        },
      },
      {
        name: 'Bulgogi',
        note: {
          ro: 'Vită marinată dulce-sărată, la grătar.',
          ru: 'Маринованная говядина на гриле.',
          en: 'Sweet-savoury marinated grilled beef.',
        },
      },
    ],
  },
  {
    id: 'indian',
    flag: '🇮🇳',
    emoji: '🍛',
    gradient: ['#e08b2c', '#3f8f5f'],
    name: { ro: 'Indiană', ru: 'Индийская', en: 'Indian' },
    description: {
      ro: 'Mirodenii prăjite în grăsime pentru aromă, cu multe preparate vegetariene.',
      ru: 'Специи, раскрытые в масле, и множество вегетарианских блюд.',
      en: 'Spices bloomed in fat, with a deep vegetarian repertoire.',
    },
    staples: {
      ro: ['Turmeric', 'Chimion', 'Garam masala', 'Linte', 'Lapte de cocos', 'Ghee'],
      ru: ['Куркума', 'Зира', 'Гарам масала', 'Чечевица', 'Кокосовое молоко', 'Гхи'],
      en: ['Turmeric', 'Cumin', 'Garam masala', 'Lentils', 'Coconut milk', 'Ghee'],
    },
    signatureDishes: [
      {
        name: 'Chana masala',
        note: {
          ro: 'Năut în sos de roșii condimentat.',
          ru: 'Нут в пряном томатном соусе.',
          en: 'Chickpeas in a spiced tomato sauce.',
        },
      },
      {
        name: 'Dal',
        note: {
          ro: 'Linte gătită moale, baza mesei zilnice.',
          ru: 'Разваренная чечевица — основа ежедневного стола.',
          en: 'Soft-cooked lentils, the everyday staple.',
        },
      },
      {
        name: 'Biryani',
        note: {
          ro: 'Orez aromat stratificat cu carne sau legume.',
          ru: 'Ароматный слоёный рис с мясом или овощами.',
          en: 'Fragrant layered rice with meat or vegetables.',
        },
      },
    ],
  },
  {
    id: 'greek',
    flag: '🇬🇷',
    emoji: '🫒',
    gradient: ['#3f7fd6', '#e8e2d6'],
    name: { ro: 'Grecească', ru: 'Греческая', en: 'Greek' },
    description: {
      ro: 'Ulei de măsline, legume crude și brânză feta — mediteraneană în esență.',
      ru: 'Оливковое масло, свежие овощи и фета — сама суть Средиземноморья.',
      en: 'Olive oil, raw vegetables and feta — Mediterranean at its core.',
    },
    staples: {
      ro: ['Ulei de măsline', 'Feta', 'Măsline Kalamata', 'Oregano', 'Lămâie', 'Iaurt'],
      ru: ['Оливковое масло', 'Фета', 'Оливки каламата', 'Орегано', 'Лимон', 'Йогурт'],
      en: ['Olive oil', 'Feta', 'Kalamata olives', 'Oregano', 'Lemon', 'Yoghurt'],
    },
    signatureDishes: [
      {
        name: 'Horiatiki',
        note: {
          ro: 'Salata grecească tradițională, fără frunze verzi.',
          ru: 'Традиционный греческий салат — без листьев салата.',
          en: 'The traditional Greek salad — no lettuce.',
        },
      },
      {
        name: 'Moussaka',
        note: {
          ro: 'Straturi de vinete, carne și bechamel.',
          ru: 'Слои баклажанов, мяса и бешамеля.',
          en: 'Layers of aubergine, meat and béchamel.',
        },
      },
      {
        name: 'Souvlaki',
        note: {
          ro: 'Frigărui marinate cu lămâie și oregano.',
          ru: 'Шашлычки с лимоном и орегано.',
          en: 'Skewers marinated with lemon and oregano.',
        },
      },
    ],
  },
  {
    id: 'turkish',
    flag: '🇹🇷',
    emoji: '🥙',
    gradient: ['#d64545', '#3f8f9e'],
    name: { ro: 'Turcească', ru: 'Турецкая', en: 'Turkish' },
    description: {
      ro: 'Punte între Balcani și Orientul Mijlociu: grătar, mezeuri și patiserie cu sirop.',
      ru: 'Мост между Балканами и Ближним Востоком: гриль, мезе и выпечка в сиропе.',
      en: 'A bridge between the Balkans and the Middle East: grills, meze and syrup pastry.',
    },
    staples: {
      ro: ['Iaurt', 'Bulgur', 'Susan', 'Pătrunjel', 'Ardei roșu uscat', 'Miel'],
      ru: ['Йогурт', 'Булгур', 'Кунжут', 'Петрушка', 'Сушёный красный перец', 'Баранина'],
      en: ['Yoghurt', 'Bulgur', 'Sesame', 'Parsley', 'Dried red pepper', 'Lamb'],
    },
    signatureDishes: [
      {
        name: 'Baklava',
        note: {
          ro: 'Foi subțiri cu nuci, însiropate.',
          ru: 'Тонкое тесто с орехами в сиропе.',
          en: 'Thin layered pastry with nuts and syrup.',
        },
      },
      {
        name: 'Menemen',
        note: {
          ro: 'Ouă cu roșii și ardei, la micul dejun.',
          ru: 'Яйца с помидорами и перцем на завтрак.',
          en: 'Eggs with tomato and peppers, for breakfast.',
        },
      },
      {
        name: 'Kebap',
        note: {
          ro: 'Familie largă de preparate la grătar.',
          ru: 'Большое семейство блюд на гриле.',
          en: 'A wide family of grilled dishes.',
        },
      },
    ],
  },
  {
    id: 'georgian',
    flag: '🇬🇪',
    emoji: '🧀',
    gradient: ['#c0392b', '#4b8f5f'],
    name: { ro: 'Georgiană', ru: 'Грузинская', en: 'Georgian' },
    description: {
      ro: 'Nuci, condimente și pâine cu brânză — o bucătărie făcută pentru masa în grup.',
      ru: 'Орехи, специи и хлеб с сыром — кухня для большого застолья.',
      en: 'Walnuts, spices and cheese bread — a cuisine built for the shared table.',
    },
    staples: {
      ro: ['Nuci', 'Coriandru', 'Sulguni', 'Rodie', 'Usturoi', 'Khmeli suneli'],
      ru: ['Грецкие орехи', 'Кинза', 'Сулугуни', 'Гранат', 'Чеснок', 'Хмели-сунели'],
      en: ['Walnuts', 'Coriander', 'Sulguni cheese', 'Pomegranate', 'Garlic', 'Khmeli suneli'],
    },
    signatureDishes: [
      {
        name: 'Khachapuri',
        note: {
          ro: 'Pâine cu brânză; varianta Adjaruli are ou deasupra.',
          ru: 'Хлеб с сыром; аджарский — с яйцом сверху.',
          en: 'Cheese bread; the Adjaruli version carries an egg.',
        },
      },
      {
        name: 'Khinkali',
        note: {
          ro: 'Găluște mari cu zeamă în interior.',
          ru: 'Большие пельмени с бульоном внутри.',
          en: 'Large dumplings holding hot broth.',
        },
      },
      {
        name: 'Pkhali',
        note: {
          ro: 'Pastă de legume cu nuci și condimente.',
          ru: 'Овощная паста с орехами и специями.',
          en: 'Vegetable and walnut paste with spices.',
        },
      },
    ],
  },
  {
    id: 'spanish',
    flag: '🇪🇸',
    emoji: '🥘',
    gradient: ['#e0952c', '#c0392b'],
    name: { ro: 'Spaniolă', ru: 'Испанская', en: 'Spanish' },
    description: {
      ro: 'Tapas de împărțit, orez cu șofran și produse curate, gătite simplu.',
      ru: 'Тапас, рис с шафраном и простые качественные продукты.',
      en: 'Shared tapas, saffron rice and clean produce cooked simply.',
    },
    staples: {
      ro: ['Ulei de măsline', 'Șofran', 'Boia afumată', 'Jamón', 'Roșii', 'Orez bomba'],
      ru: ['Оливковое масло', 'Шафран', 'Копчёная паприка', 'Хамон', 'Помидоры', 'Рис бомба'],
      en: ['Olive oil', 'Saffron', 'Smoked paprika', 'Jamón', 'Tomatoes', 'Bomba rice'],
    },
    signatureDishes: [
      {
        name: 'Paella',
        note: {
          ro: 'Orez valencian gătit într-o tigaie largă.',
          ru: 'Валенсийский рис в широкой сковороде.',
          en: 'Valencian rice cooked in a wide pan.',
        },
      },
      {
        name: 'Tortilla española',
        note: {
          ro: 'Omletă groasă cu cartofi și ceapă.',
          ru: 'Толстый омлет с картофелем и луком.',
          en: 'Thick potato and onion omelette.',
        },
      },
      {
        name: 'Gazpacho',
        note: {
          ro: 'Supă rece de roșii, pentru vară.',
          ru: 'Холодный томатный суп для лета.',
          en: 'Chilled tomato soup for the summer.',
        },
      },
    ],
  },
  {
    id: 'american',
    flag: '🇺🇸',
    emoji: '🍔',
    gradient: ['#3f6fd6', '#d64545'],
    name: { ro: 'Americană', ru: 'Американская', en: 'American' },
    description: {
      ro: 'Bucătărie de sinteză: brunch, grătar afumat lent și porții generoase.',
      ru: 'Кухня-сплав: бранч, медленное барбекю и щедрые порции.',
      en: 'A cuisine of fusion: brunch, slow barbecue and generous plates.',
    },
    staples: {
      ro: ['Unt', 'Sirop de arțar', 'Cheddar', 'Boia afumată', 'Porumb', 'Fasole'],
      ru: ['Сливочное масло', 'Кленовый сироп', 'Чеддер', 'Копчёная паприка', 'Кукуруза', 'Фасоль'],
      en: ['Butter', 'Maple syrup', 'Cheddar', 'Smoked paprika', 'Corn', 'Beans'],
    },
    signatureDishes: [
      {
        name: 'Pancakes',
        note: {
          ro: 'Clătite pufoase cu sirop de arțar.',
          ru: 'Пышные панкейки с кленовым сиропом.',
          en: 'Fluffy pancakes with maple syrup.',
        },
      },
      {
        name: 'Caesar salad',
        note: {
          ro: 'Inventată în Tijuana, adoptată în SUA.',
          ru: 'Придуман в Тихуане, прижился в США.',
          en: 'Invented in Tijuana, adopted in the US.',
        },
      },
      {
        name: 'BBQ ribs',
        note: {
          ro: 'Coaste afumate ore întregi, la temperatură joasă.',
          ru: 'Рёбра, копчёные часами при низкой температуре.',
          en: 'Ribs smoked low and slow for hours.',
        },
      },
    ],
  },
  {
    id: 'arabic',
    flag: '🇱🇧',
    emoji: '🧆',
    gradient: ['#7f9e3f', '#c9a227'],
    name: { ro: 'Arabă', ru: 'Арабская', en: 'Arabic' },
    description: {
      ro: 'Mezze generos: susan, leguminoase, ierburi proaspete și lămâie.',
      ru: 'Щедрое мезе: кунжут, бобовые, свежая зелень и лимон.',
      en: 'Generous mezze: sesame, pulses, fresh herbs and lemon.',
    },
    staples: {
      ro: ['Tahini', 'Năut', 'Pătrunjel', 'Lămâie', 'Susan', 'Za’atar'],
      ru: ['Тахини', 'Нут', 'Петрушка', 'Лимон', 'Кунжут', 'Заатар'],
      en: ['Tahini', 'Chickpeas', 'Parsley', 'Lemon', 'Sesame', 'Za’atar'],
    },
    signatureDishes: [
      {
        name: 'Hummus',
        note: {
          ro: 'Pastă de năut cu tahini, lămâie și usturoi.',
          ru: 'Паста из нута с тахини, лимоном и чесноком.',
          en: 'Chickpea purée with tahini, lemon and garlic.',
        },
      },
      {
        name: 'Tabbouleh',
        note: {
          ro: 'Salată de pătrunjel cu bulgur și lămâie.',
          ru: 'Салат из петрушки с булгуром и лимоном.',
          en: 'Parsley salad with bulgur and lemon.',
        },
      },
      {
        name: 'Falafel',
        note: {
          ro: 'Chiftele de năut crud, prăjite.',
          ru: 'Котлетки из сырого нута, обжаренные во фритюре.',
          en: 'Fried patties of soaked raw chickpeas.',
        },
      },
    ],
  },
];

export const getCuisine = (id: string) => CUISINES.find((c) => c.id === id);
