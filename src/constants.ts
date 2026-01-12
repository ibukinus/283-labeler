import { Label } from './types.js';

/**
 * Jetstream設定
 */
export const JETSTREAM_CONFIG = {
  WANTED_COLLECTIONS: ['app.bsky.feed.like'] as const,
} as const;

/**
 * ラベル定義のデフォルト値
 */
export const LABEL_DEFINITION_DEFAULTS = {
  severity: 'inform' as const,
  blurs: 'none' as const,
  defaultSetting: 'warn' as const,
  adultOnly: false as const,
} as const;

/**
 * データベース設定のデフォルト値
 */
export const DATABASE_CONFIG = {
  LABELER_DB_PATH_DEFAULT: 'labels.db',
  LIKE_DB_PATH_DEFAULT: 'database.db',
  LABELER_PORT_DEFAULT: 14831,
} as const;

/**
 * キャッシュキー生成
 *
 * DIDとrkeyを組み合わせてキャッシュキーを生成します。
 *
 * @param did - ユーザーのDID
 * @param rkey - レコードキー
 * @returns キャッシュキー（形式: `${did}:${rkey}`）
 */
export function generateCacheKey(did: string, rkey: string): string {
  return `${did}:${rkey}`;
}

export const LABELS: Label[] = [
  {
    identifier: 'idol-mano',
    locales: [
      { lang: 'ja', name: '櫻木真乃', description: 'ほんわかした癒し系の女の子で、心優しい性格。\n見ていて守りたくなるタイプで、一緒にいるだけで何となく幸せな気持ちになる。高校1年生。' },
    ]
  },
  {
    identifier: 'idol-hiori',
    locales: [
      { lang: 'ja', name: '風野灯織', description: '後ろでまとめた黒髪が印象的な、クール系美少女。\n自分が納得するまで努力を欠かさないストイックな性格の持ち主。高校1年生。' },
    ]
  },
  {
    identifier: 'idol-meguru',
    locales: [
      { lang: 'ja', name: '八宮めぐる', description: '天真爛漫な性格で、誰にでも積極的に話しかける。\nとにかく元気で友達想いの女の子。\n日本人の父とアメリカ人の母を持つ。高校1年生。' },
    ]
  },
  {
    identifier: 'idol-kogane',
    locales: [
      { lang: 'ja', name: '月岡恋鐘', description: '自信たっぷりで何があってもポジティブな性格。\nスタイルもよく人目を引く可愛さだが、よく転ぶ、\nダンスを間違えるなどのドジな一面も併せ持つ。' },
    ]
  },
  {
    identifier: 'idol-mamimi',
    locales: [
      { lang: 'ja', name: '田中摩美々', description: 'ダウナー系で、面倒なことが嫌いなパンキッシュガール。\n顔もスタイルも抜群の美少女だが、\n自分の興味を持ったこと以外には無頓着な性格。高校3年生。' },
    ]
  },
  {
    identifier: 'idol-sakuya',
    locales: [
      { lang: 'ja', name: '白瀬咲耶', description: '女子校に通い、スポーツ万能、学業優秀、容姿端麗なモデル系美人。\n立ち居振舞いも王子様のようにかっこよく、\n女子からの人気が高い。高校3年生。' },
    ]
  },
  {
    identifier: 'idol-yuika',
    locales: [
      { lang: 'ja', name: '三峰結華', description: '自由奔放で掴みどころのないサブカル系眼鏡女子。\n美人でノリもよく、初対面の人に対しても気後れせずに\n話しができる。大学1年生。' },
    ]
  },
  {
    identifier: 'idol-kiriko',
    locales: [
      { lang: 'ja', name: '幽谷霧子', description: 'ミステリアスな雰囲気を醸し出す銀髪の女の子。\n儚げな雰囲気とぐるぐると巻いた包帯が特徴的。\n口数は少ないが、心優しい性格。高校2年生。' },
    ]
  },
  {
    identifier: 'idol-kaho',
    locales: [
      { lang: 'ja', name: '小宮果穂', description: '大人びた容姿と高い身長が特徴の女の子。\n何にでも興味津々で純粋な様子は、まるで子犬のよう。\n特撮モノが大好きでヒーローに憧れている。小学6年生。' },
    ]
  },
  {
    identifier: 'idol-chiyoko',
    locales: [
      { lang: 'ja', name: '園田智代子', description: 'クラスに一人はいるごく普通の女の子。\n明るく親しみやすい性格で、甘いものが大好き。\n名前にちなんで、チョコ好きアイドルを売りにしている。高校2年生。' },
    ]
  },
  {
    identifier: 'idol-juri',
    locales: [
      { lang: 'ja', name: '西城樹里', description: 'ボーイッシュでクールな女の子。\n言葉遣いが乱暴なので人に怖がられることが多いが、\n根は純情で、素直になれないタイプ。高校2年生。' },
    ]
  },
  {
    identifier: 'idol-rinze',
    locales: [
      { lang: 'ja', name: '杜野凛世', description: '落ち着いた佇まいの大和撫子。\n常に礼儀正しく、一歩引いて相手を立てる性格。\n少女漫画好きという意外な趣味を持つ。高校1年生。' },
    ]
  },
  {
    identifier: 'idol-natsuha',
    locales: [
      { lang: 'ja', name: '有栖川夏葉', description: '裕福な家庭に生まれた社長令嬢。家名に誇りを持ち、\n自らもその肩書に恥じぬよう日々鍛錬を積んでいる。\nスタイルがよく、引き締まっている。大学2年生。' },
    ]
  },
  {
    identifier: 'idol-amana',
    locales: [
      { lang: 'ja', name: '大崎甘奈', description: '大崎姉妹の双子の妹。\n誰とでも分け隔てなく接する天真爛漫なギャル。\n今しかできないことを全力で楽しみたい今ドキの女の子。高校2年生。' },
    ]
  },
  {
    identifier: 'idol-tenka',
    locales: [
      { lang: 'ja', name: '大崎甜花', description: '大崎姉妹の双子の姉。幼い頃から妹の甘奈に面倒を見てもらっている。\n人と話すのが苦手で、アニメやゲームなど、\nインドアな趣味が多い。高校2年生。' },
    ]
  },
  {
    identifier: 'idol-chiyuki',
    locales: [
      { lang: 'ja', name: '桑山千雪', description: '優しい笑顔が印象的な、事務所のお姉さん的存在。\n母性溢れる落ち着いた佇まいが特徴。\n手先が器用で、かわいい小物を作るのが趣味。' },
    ]
  },
  {
    identifier: 'idol-asahi',
    locales: [
      { lang: 'ja', name: '芹沢あさひ', description: '常に面白いことを探し、じっとしていることがない、\n探究心の強い女の子。興味を持ったら一直線だが、\n飽きっぽい一面も持つ中学2年生。' },
    ]
  },
  {
    identifier: 'idol-fuyuko',
    locales: [
      { lang: 'ja', name: '黛冬優子', description: '常に控えめな笑顔で、清楚な女の子。\n可愛いものが大好きで、周囲への気配りもできるため\n人に好かれる性格。専門学校1年生。' },
    ]
  },
  {
    identifier: 'idol-mei',
    locales: [
      { lang: 'ja', name: '和泉愛依', description: 'ノリがよく、楽天的で大雑把な性格の女の子。\n難しいことを考えるのは苦手だが、親しみやすい高校3年生。' },
    ]
  },
  {
    identifier: 'idol-toru',
    locales: [
      { lang: 'ja', name: '浅倉透', description: '自然体で飾らない性格。周囲からどう見られるか\nということを気にせず、おおらかでマイペース。\nしかしその透明感あふれる佇まいには\n誰をも惹きつけるオーラがある。高校2年生。' },
    ]
  },
  {
    identifier: 'idol-madoka',
    locales: [
      { lang: 'ja', name: '樋口円香', description: 'クールでシニカルな高校2年生。\n涼しげな目元と泣きぼくろが特徴。\nプロデューサーに冷たい態度を取る。' },
    ]
  },
  {
    identifier: 'idol-koito',
    locales: [
      { lang: 'ja', name: '福丸小糸', description: '内弁慶な小動物系の女の子。\n真面目な努力家で、勉強が得意。\n騙されやすく、幼なじみによくからかわれている。高校1年生。' },
    ]
  },
  {
    identifier: 'idol-hinana',
    locales: [
      { lang: 'ja', name: '市川雛菜', description: '自分の「しあわせ」に向かって突き進む、奔放な女の子。\n幼馴染みで先輩の透を慕っている。高校1年生。' },
    ]
  },
  {
    identifier: 'idol-nichika',
    locales: [
      { lang: 'ja', name: '七草にちか', description: '気が強く甘え上手な「みんなの妹」\nアイドルに強い憧れを抱いており、譲れない思いや負けず\n嫌いな面をのぞかせることも。高校1年生。' },
    ]
  },
  {
    identifier: 'idol-mikoto',
    locales: [
      { lang: 'ja', name: '緋田美琴', description: '一途でひたむきな美人だが、寝食など身の回りのことを\n疎かにしがち。アイドル経験者でもあり、誰よりも\n『アイドル』への想いが強い。' },
    ]
  },
  {
    identifier: 'idol-luca',
    locales: [
      { lang: 'ja', name: '斑鳩ルカ', description: '悩める現代女子たちの『カミサマ』として\n一部でカルト的な人気を集めている。\n荒々しい言動で周囲を威嚇することも多いが、\n実は脆く傷つきやすい一面も。' },
    ]
  },
  {
    identifier: 'idol-hana',
    locales: [
      { lang: 'ja', name: '鈴木羽那', description: '明るく穏やかかつ、素直な性格の女の子。\n内面・外見ともに誰からも愛される、\nまさに「天性のアイドル」' },
    ]
  },
  {
    identifier: 'idol-haruki',
    locales: [
      { lang: 'ja', name: '郁田はるき', description: '甘い笑顔とふわふわボブヘアーがキュートな女の子。\n感性豊かでクリエィティブなことが大好き。\nこれと閃いたら果敢に飛び込んでいく\nアクティブな一面もある高校2年生。' },
    ]
  },
  {
    identifier: 'staff-tsutomu',
    locales: [
      { lang: 'ja', name: '天井努', description: '283プロダクションの社長。' },
    ]
  },
  {
    identifier: 'staff-hazuki',
    locales: [
      { lang: 'ja', name: '七草はづき', description: '283プロダクションで事務などのサポートを勤める。\n細やかな気配りでアイドルたちの輝く日々を支える、陰の立役者。' },
    ]
  },
  {
    identifier: 'unit-illuminationstars',
    locales: [
      { lang: 'ja', name: 'イルミネーションスターズ', description: '瞳に輝く、無限の可能性\n\n小さな光を宿す少女たちで結成された、新世代のアイドルユニット。\n今はまだかすかな輝きでも、時にぶつかり時に支え合いながら、一等星を目指して歩んでいく！' },
    ]
  },
  {
    identifier: 'unit-lantica',
    locales: [
      { lang: 'ja', name: 'アンティーカ', description: '回せ、錆びついた運命の鍵を\n\n胸に燻る焔を「ウタ」に、孤独な泪を「ネガイ」に変える、\n新世界の革命的アイドルユニット。ゴシックなドレスを纏い、\n彼女たちは希望を謳い続ける―。' },
    ]
  },
  {
    identifier: 'unit-hokagoclimaxgirls',
    locales: [
      { lang: 'ja', name: '放課後クライマックスガールズ', description: '女の子はいつだって放課後がクライマックス！\n\n個性と個性がぶつかり合う全力系アイドルユニット。\n全身全霊でアイドル道を突き進む彼女達の姿こそ、"クライマックス"の証。\nファンもプロデューサーも世界も巻き込んでアイドル界のてっぺんを目指す！！' },
    ]
  },
  {
    identifier: 'unit-alstroemeria',
    locales: [
      { lang: 'ja', name: 'アルストロメリア', description: '花ざかり、私達の幸福論\n\nポップでハッピーな3人組アイドルユニット。\nアルストロメリアの花言葉「未来への憧れ」を胸に抱き、\n今日もシアワセなパフォーマンスで会場に笑顔を咲かせます！' },
    ]
  },
  {
    identifier: 'unit-straylight',
    locales: [
      { lang: 'ja', name: 'ストレイライト', description: '身に纏う迷光、少女たちは偶像となる\n\n実在と非実在を行き来するカリスマ的アイドルユニット。\nアイドルというアバターを身に纏い、歌うは真実か、狂気か。\n解き放たれた迷光が、今日も世界を奔る。' },
    ]
  },
  {
    identifier: 'unit-noctchill',
    locales: [
      { lang: 'ja', name: 'ノクチル', description: 'さよなら、透明だった僕たち\n\n幼なじみ4人で結成された、透明感あふれるアイドルユニット\n誰かになる必要なんてない──\n走り出す波を追って、少女たちは碧い風になる' },
    ]
  },
  {
    identifier: 'unit-shhis',
    locales: [
      { lang: 'ja', name: 'シーズ', description: '耀いて、スパンコール・シャンデリア\n\nスパイシー&ガーリーなダンスポップユニット。\n音楽はとまらない。だから黙って聴いていて。\n駆け出す心のBPMを、抑えられない旋律を。\nわたし(she)がわたし(she)になるための、1000カラットの物語を。' },
    ]
  },
  {
    identifier: 'unit-cometik',
    locales: [
      { lang: 'ja', name: 'コメティック', description: '新時代到来の予兆、黒色彗星\n\n突如として飛来した、新時代のアイドルユニット。\n黒を纏い、カラーに囚われない少女たち。\n彗星の軌跡[ストーリー]が示すのは、闇か光か、はたまた──' },
    ]
  },
  {
    identifier: 'unit-imacutiefinder',
    locales: [
      { lang: 'ja', name: 'I\'m a Cutie Finder', description: '世界のカワイイをみんなに届けたい♡♡♡♡♡' },
    ]
  },
  {
    identifier: 'unit-fumage',
    locales: [
      { lang: 'ja', name: 'Fumage', description: '火よ、それは痛みと夢の？' },
    ]
  },
  {
    identifier: 'unit-sonicheart',
    locales: [
      { lang: 'ja', name: 'Sonic Heart (and Signal)', description: 'Speed Up! Keep Running!' },
    ]
  },
];
