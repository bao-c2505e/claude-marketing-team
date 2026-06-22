import type { CampaignBrief, ContentPlanJob, ContentPlanItem, PlanLengthDays } from '../../types/core';
import { generateId } from './coreData';

// ---------------------------------------------------------------------------
// Phase 6 — Deterministic mock content generator
// No external AI API calls. All content derived from brief fields.
// Generated ≠ Approved. Approved ≠ Published. No auto-post.
// ---------------------------------------------------------------------------

type ContentAngle =
  | 'product_showcase'
  | 'promo_offer'
  | 'behind_the_scenes'
  | 'customer_review'
  | 'lifestyle'
  | 'education'
  | 'event_launch';

const ANGLE_SEQUENCE: ContentAngle[] = [
  'product_showcase',
  'promo_offer',
  'behind_the_scenes',
  'customer_review',
  'lifestyle',
  'education',
  'event_launch',
];

const ANGLE_LABEL: Record<ContentAngle, string> = {
  product_showcase:  'Product Showcase',
  promo_offer:       'Promo & Offer',
  behind_the_scenes: 'Behind the Scenes',
  customer_review:   'Customer Review',
  lifestyle:         'Lifestyle',
  education:         'Education',
  event_launch:      'Event & Launch',
};

const ANGLE_CONTENT_TYPE: Record<ContentAngle, string> = {
  product_showcase:  'caption',
  promo_offer:       'ad_copy',
  behind_the_scenes: 'caption',
  customer_review:   'caption',
  lifestyle:         'caption',
  education:         'caption',
  event_launch:      'caption',
};

function parseList(val: string | string[] | null | undefined, fallback: string[]): string[] {
  if (!val) return fallback;
  if (Array.isArray(val)) return val.filter(Boolean);
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

function pick<T>(arr: T[], index: number): T {
  return arr[((index % arr.length) + arr.length) % arr.length];
}

function buildHook(angle: ContentAngle, brief: CampaignBrief, day: number, keyMessages: string[]): string {
  const product = brief.product_focus || brief.hero_product || 'sản phẩm';
  const offer   = brief.offer || 'ưu đãi đặc biệt';
  const brand   = brief.brand_name || 'thương hiệu';
  const msg     = pick(keyMessages, day - 1);
  const rem     = Math.max(1, 7 - ((day - 1) % 7));
  const title   = brief.brief_title || brand;

  const map: Record<ContentAngle, string[]> = {
    product_showcase: [
      `✨ ${product} — Khám phá điều làm nên sự khác biệt!`,
      `🔥 Đã thử ${product} chưa? Hãy để ${brand} thuyết phục bạn!`,
      `💯 ${msg}`,
      `⭐ ${product}: Chất lượng không cần nói thêm.`,
      `🎯 Vì sao mọi người chọn ${product}?`,
    ],
    promo_offer: [
      `🎁 ƯU ĐÃI CÓ HẠN: ${offer}`,
      `⏰ Còn ${rem} ngày — Đừng bỏ lỡ!`,
      `💥 DEAL HOT: ${offer}`,
      `🎉 ${offer} — Dành riêng cho bạn!`,
      `💰 Tiết kiệm ngay với ${brand}!`,
    ],
    behind_the_scenes: [
      `👀 Hậu trường chế tác ${product}!`,
      `🎬 ${brand} chia sẻ quy trình tỉ mỉ!`,
      `🔍 ${product} được làm ra như thế nào?`,
      `💡 Câu chuyện phía sau: Chi tiết tạo nên khác biệt.`,
      `🏭 Ngày ${day}: Quy trình đảm bảo chất lượng.`,
    ],
    customer_review: [
      `⭐⭐⭐⭐⭐ Khách hàng nói gì về ${brand}?`,
      `💬 "Không thể không quay lại!" — Review thật.`,
      `🗣️ Trải nghiệm thật từ khách hàng thật!`,
      `🌟 ${brand} — Được lòng khách hàng vì điều gì?`,
      `❤️ Hành trình của khách hàng cùng ${brand}.`,
    ],
    lifestyle: [
      `🌅 Cuộc sống đẹp hơn cùng ${product}!`,
      `💫 Khoảnh khắc hoàn hảo cùng ${brand}.`,
      `🏠 Không gian phản ánh bạn là ai.`,
      `☀️ Ngày mới, trải nghiệm mới cùng ${brand}.`,
      `🌟 ${msg} — Sống theo cách bạn muốn.`,
    ],
    education: [
      `📚 3 điều bạn chưa biết về ${product}!`,
      `💡 Tip: Tận hưởng ${product} đúng cách!`,
      `🔬 Vì sao ${product} được tin tưởng?`,
      `📖 Fact hay về ${brand}!`,
      `🧠 Ngày ${day}: Khám phá ${product}.`,
    ],
    event_launch: [
      `🚀 CHÍNH THỨC: ${title}!`,
      `🎊 SỰ KIỆN ĐẶC BIỆT — ${brand} thông báo!`,
      `🌟 ${product} chính thức có mặt!`,
      `📣 ANNOUNCEMENT: ${title}!`,
      `🎉 Ra mắt ngày ${day} — Điều bất ngờ đang chờ!`,
    ],
  };

  return pick(map[angle], day);
}

function buildCaption(
  angle: ContentAngle,
  brief: CampaignBrief,
  day: number,
  pillar: string,
  keyMessages: string[],
): string {
  const product  = brief.product_focus || brief.hero_product || 'sản phẩm';
  const offer    = brief.offer || 'ưu đãi đặc biệt';
  const audience = brief.target_audience || 'khách hàng';
  const brand    = brief.brand_name || 'thương hiệu';
  const goal     = brief.campaign_goal || '';
  const include  = brief.must_include || '';
  const keyMsg   = pick(keyMessages, day - 1);
  const title    = brief.brief_title || goal.split('.')[0] || brand;
  const goalLine = goal ? `🎯 ${goal.split('.')[0]}.` : '';
  const incLine  = include ? `\n📌 ${include}` : '';

  const map: Record<ContentAngle, string> = {
    product_showcase:
      `${product} — ${keyMsg}.\n\n${goalLine}\n\n👥 Dành cho: ${audience}.${incLine}\n\n🔔 Theo dõi ${brand}!\n\n📍 Pillar: ${pillar}`,

    promo_offer:
      `🎁 ${offer}\n\n• ${keyMsg}\n• Dành cho: ${audience}\n\n⏰ Ưu đãi có thời hạn!${incLine}\n\n📍 Pillar: ${pillar}`,

    behind_the_scenes:
      `Đằng sau ${product} là cả một hành trình tâm huyết.\n\n${keyMsg}.\n\nChúng tôi không ngừng nỗ lực vì bạn.${incLine}\n\n💪 ${brand} — Cam kết chất lượng.\n\n📍 Pillar: ${pillar}`,

    customer_review:
      `Cảm ơn quý khách đã ủng hộ ${brand}! ❤️\n\n"${keyMsg}"\n\n💬 Bạn đã trải nghiệm ${product} chưa?\n\n${audience} — Chúng tôi luôn lắng nghe.\n\n📍 Pillar: ${pillar}`,

    lifestyle:
      `${product} — Không chỉ là sản phẩm, đây là phong cách sống.\n\n${keyMsg}.\n\n🌟 Dành cho ${audience}.${incLine}\n\nSống đúng với con người bạn.\n\n📍 Pillar: ${pillar}`,

    education:
      `Bạn có biết? ${keyMsg}.\n\n📚 Từ ${brand}:\n• ${product} mang lại gì?\n• ${audience} — Điều bạn xứng đáng nhận.${incLine}\n\n💡 Theo dõi kiến thức bổ ích!\n\n📍 Pillar: ${pillar}`,

    event_launch:
      `🎉 ${title} — CHÍNH THỨC ĐẾN RỒI!\n\n${keyMsg}.\n\n${offer ? '🎁 Ưu đãi: ' + offer + '\n\n' : ''}👥 Dành cho: ${audience}${incLine}\n\n📅 Theo dõi ${brand}!\n\n📍 Pillar: ${pillar}`,
  };

  return map[angle];
}

function buildVisualBrief(angle: ContentAngle, brief: CampaignBrief, channel: string, day: number): string {
  const product  = brief.hero_product || 'sản phẩm';
  const brand    = brief.brand_name || 'thương hiệu';
  const audience = brief.target_audience?.split(',')[0] || 'khách hàng';

  const spec = channel === 'TikTok'
    ? 'Video dọc 9:16, 15–60s. Âm thanh: ASMR/nhạc trending. Phụ đề tiếng Việt.'
    : channel === 'Instagram'
    ? 'Ảnh 1:1 (feed) hoặc Reels 9:16. Chất lượng: tối thiểu 1080x1080px.'
    : channel === 'YouTube'
    ? 'Video 16:9, tối thiểu 60s. Thumbnail bắt mắt.'
    : 'Ảnh/video 16:9 hoặc 1:1. Tối thiểu 1200px.';

  const map: Record<ContentAngle, string> = {
    product_showcase:
      `📸 Cận cảnh ${product} trên nền sạch. Ánh sáng tự nhiên/studio. Rule of thirds. Logo ${brand} góc dưới. Ngày ${day}. ${spec}`,
    promo_offer:
      `📸 Banner: ${product} trung tâm, chữ ưu đãi nổi bật, ribbon "SALE". Logo thương hiệu. CTA rõ. ${spec}`,
    behind_the_scenes:
      `🎬 Cảnh thực tế: bàn tay với ${product}, vật liệu thật. Raw & authentic. Natural light. ${spec}`,
    customer_review:
      `📷 Khách hàng thật đang dùng ${product}. Biểu cảm tự nhiên. Text overlay: trích dẫn review. ${spec}`,
    lifestyle:
      `📸 Lifestyle: ${audience} trong bối cảnh phù hợp. ${product} xuất hiện tự nhiên. Tông màu ấm/hiện đại. ${spec}`,
    education:
      `📊 Infographic sạch hoặc tutorial ngắn. Màu thương hiệu ${brand}. Text lớn cho mobile. Step-by-step. ${spec}`,
    event_launch:
      `🎊 Visual ra mắt: festive, confetti/hiệu ứng nếu video. Logo lớn. Thông điệp nổi bật. Ngày ${day}. ${spec}`,
  };

  return map[angle];
}

function buildCTA(angle: ContentAngle, brief: CampaignBrief): string {
  const ind    = (brief.industry || '').toLowerCase();
  const isFood = ind.includes('f&b') || ind.includes('food') || ind.includes('ẩm thực') || ind.includes('cơm') || ind.includes('cuốn');
  const isPrem = ind.includes('cao cấp') || ind.includes('premium') || ind.includes('specialty') || ind.includes('đặc sản');

  const food: Record<ContentAngle, string> = {
    product_showcase:  '👉 Ghé thăm ngay! Địa chỉ trong bio.',
    promo_offer:       '⏰ Order/Đặt bàn ngay! Link trong bio.',
    behind_the_scenes: '❤️ Theo dõi để xem thêm hậu trường!',
    customer_review:   '💬 Bạn đã thử chưa? Bình luận cảm nhận!',
    lifestyle:         '📍 Địa chỉ trong bio. Ghé ngay nhé!',
    education:         '🔔 Theo dõi để nhận tips ẩm thực mỗi ngày!',
    event_launch:      '🎉 Đặt bàn/Order sớm để nhận ưu đãi! Bio.',
  };

  const prem: Record<ContentAngle, string> = {
    product_showcase:  '📞 Ghé quán trải nghiệm trực tiếp. Link bio.',
    promo_offer:       '✅ Đặt trước để giữ ưu đãi! Hotline bio.',
    behind_the_scenes: '👀 Ghé quán xem tận nơi. Đặt chỗ qua bio.',
    customer_review:   '💼 Tư vấn miễn phí — Liên hệ chuyên gia!',
    lifestyle:         '🏠 Nâng tầm trải nghiệm mỗi ngày. Bio.',
    education:         '📖 Xem menu/bộ sưu tập đầy đủ — Link bio!',
    event_launch:      '🎊 Đăng ký tham dự sự kiện! Link bio.',
  };

  const def: Record<ContentAngle, string> = {
    product_showcase:  '👉 Khám phá ngay! Link bio.',
    promo_offer:       '⏰ Xem chi tiết ưu đãi tại link bio.',
    behind_the_scenes: '❤️ Theo dõi để xem thêm!',
    customer_review:   '💬 Chia sẻ trải nghiệm bên dưới!',
    lifestyle:         '🔗 Xem thêm tại link bio.',
    education:         '🔔 Theo dõi kiến thức bổ ích!',
    event_launch:      '🎉 Tham gia ngay! Link bio.',
  };

  return isFood ? food[angle] : isPrem ? prem[angle] : def[angle];
}

function buildHashtags(brief: CampaignBrief, channel: string, angle: ContentAngle): string {
  const brandTag = `#${(brief.brand_name || 'brand').replace(/\s+/g, '').replace(/[^a-zA-ZÀ-ỹ0-9]/g, '')}`;
  const ind = (brief.industry || '').toLowerCase();

  const indTags = ind.includes('f&b') || ind.includes('food') || ind.includes('ẩm thực')
    ? '#ẨmThực #FoodVietnam #FoodLovers'
    : ind.includes('cà phê') || ind.includes('coffee') || ind.includes('specialty')
    ? '#CàPhê #SpecialtyCoffee #ColdBrew'
    : ind.includes('cơm')
    ? '#CơmTấm #StreetFood #FoodVietnam'
    : '#VietnamBusiness #Marketing';

  const chTags = channel === 'TikTok'
    ? '#TikTokVN #fyp #viral'
    : channel === 'Instagram'
    ? '#instagood #reels #instadaily'
    : channel === 'YouTube'
    ? '#YouTubeVN #video'
    : '#FacebookVietnam';

  const angleTags: Record<ContentAngle, string> = {
    product_showcase:  '#SảnPhẩm #Review #ChấtLượng',
    promo_offer:       '#KhuyếnMãi #Deal #Promo',
    behind_the_scenes: '#HậuTrường #BehindTheScenes',
    customer_review:   '#Review #Feedback #KháchHàng',
    lifestyle:         '#Lifestyle #Inspiration',
    education:         '#Tips #KiếnThức',
    event_launch:      '#RaMắt #Launch #NewArrival',
  };

  return `${brandTag} ${indTags} ${chTags} ${angleTags[angle]}`;
}

function buildItem(
  brief: CampaignBrief,
  jobId: string,
  day: number,
  channel: string,
  pillar: string,
  angle: ContentAngle,
  keyMessages: string[],
  now: string,
): ContentPlanItem {
  const d = new Date();
  d.setDate(d.getDate() + day);

  return {
    id: generateId('item'),
    generation_job_id: jobId,
    brief_id: brief.id,
    campaign_id: brief.campaign_id,
    brand_id: brief.brand_id,
    client_id: brief.client_id,
    day_number: day,
    planned_date: d.toISOString().slice(0, 10),
    channel,
    content_type: ANGLE_CONTENT_TYPE[angle],
    pillar,
    angle: ANGLE_LABEL[angle],
    hook: buildHook(angle, brief, day, keyMessages),
    caption: buildCaption(angle, brief, day, pillar, keyMessages),
    visual_brief: buildVisualBrief(angle, brief, channel, day),
    cta: buildCTA(angle, brief),
    hashtags: buildHashtags(brief, channel, angle),
    status: 'needs_review',
    created_at: now,
    updated_at: now,
  };
}

export function generateContentPlan(
  brief: CampaignBrief,
  planLengthDays: PlanLengthDays,
  requestedBy: string | null = null,
): { job: ContentPlanJob; items: ContentPlanItem[] } {
  const now      = new Date().toISOString();
  const jobId    = generateId('job');
  const channels = parseList(brief.channels, ['Facebook', 'TikTok']);
  const pillars  = parseList(brief.content_pillars, ['Product', 'Promo', 'Lifestyle', 'Review']);
  const messages = parseList(brief.key_messages, ['Chất lượng thật', 'Giá trị tốt', 'Trải nghiệm tuyệt vời']);

  const items: ContentPlanItem[] = [];
  for (let day = 1; day <= planLengthDays; day++) {
    const channel = pick(channels, day - 1);
    const pillar  = pick(pillars, day - 1);
    const angle   = ANGLE_SEQUENCE[(day - 1) % ANGLE_SEQUENCE.length];
    items.push(buildItem(brief, jobId, day, channel, pillar, angle, messages, now));
  }

  const job: ContentPlanJob = {
    id: jobId,
    brief_id: brief.id,
    campaign_id: brief.campaign_id,
    brand_id: brief.brand_id,
    client_id: brief.client_id,
    plan_length_days: planLengthDays,
    generation_mode: 'mock',
    status: 'completed',
    requested_by: requestedBy,
    item_count: items.length,
    created_at: now,
    updated_at: now,
    completed_at: now,
    error_message: null,
  };

  return { job, items };
}
