export interface Spot {
    id: string;
    title: string;
    lat: number;
    lng: number;
    description: string; // Short description
    story: string; // Long form text
    imageUrl: string;
    audioUrl?: string; // Optional ambient sound or music
    location?: string; // e.g., "Tokyo, Japan"
}

export const spots: Spot[] = [
    {
        id: '1',
        title: '深夜のコインランドリー',
        lat: 35.7022,
        lng: 139.5744, // Near Kichijoji/Mitaka
        location: 'Musashino, Tokyo',
        description: '回転するドラムと白いノイズ。',
        story: `真夜中、世界が眠りについても、ここは起きている。
柔軟剤の甘い匂いと、一定のリズムで回る洗濯機。
誰かの日常が洗われ、乾燥されていく場所。
ベンチに座ってぼんやりと渦を眺めていると、
自分の悩みさえも溶けていくような気がした。`,
        imageUrl: 'https://images.unsplash.com/photo-1545173168-9f1947eebb8f?q=80&w=2671&auto=format&fit=crop', // Laundromat
        audioUrl: 'https://assets.mixkit.co/sfx/preview/mixkit-washing-machine-spin-cycle-1653.mp3' // Placeholder sound
    },
    {
        id: '2',
        title: '雨上がりの歩道橋',
        lat: 35.6586,
        lng: 139.7454, // Near Tokyo Tower
        location: 'Minato City, Tokyo',
        description: 'アスファルトの匂いと、滲む東京タワー。',
        story: `雨が止んだ直後の空気は、どこか懐かしい。
歩道橋の上から見下ろす車のヘッドライトは、
血管の中を流れる光の粒のようだ。
遠くに見える赤い鉄塔が、
濡れた空気に滲んで、いつもより少し優しく見えた。`,
        imageUrl: 'https://images.unsplash.com/photo-1504730655563-1801826f49cc?q=80&w=2670&auto=format&fit=crop' // Tokyo Night Rain vibe
    },
    {
        id: '3',
        title: '終電後の高架下',
        lat: 35.6905,
        lng: 139.7005, // Shinjuku
        location: 'Shinjuku, Tokyo',
        description: '静寂と残響。',
        story: `昼間の喧騒が嘘のように静まり返ったコンクリートの回廊。
自分の足音だけが反響する。
壁に描かれたスプレーアートが、
街頭の頼りない光に照らされて、
まるで生き物のように呼吸しているように見えた。`,
        imageUrl: 'https://images.unsplash.com/photo-1554448557-41eafdc29d89?q=80&w=2670&auto=format&fit=crop'
    }
];
