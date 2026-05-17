import * as Misskey from "misskey-js";
import { config } from "dotenv";
import cron from 'node-cron';

config();

const origin = process.env.MISSKEY_URL;
const token = process.env.MISSKEY_TOKEN;

if (!origin || !token) {
    console.error("エラー: MISSKEY_URL または MISSKEY_TOKEN が環境変数に設定されていません。");
    process.exit(1);
}

const cli = new Misskey.api.APIClient({ origin, credential: token });
const url = 'https://nekobot.xyz/api/image?type=food';

async function fetchImage() {
    const timestamp = new Date().toLocaleString('ja-JP');
    console.log(`[${timestamp}] 飯テロ画像を取得します...`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Nekobot APIエラー! ステータス: ${response.status}`);
        }

        const data = (await response.json());
        
        if (data && data.message) {
            const imageUrl = data.message;
            
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                throw new Error(`画像ダウンロードエラー! ステータス: ${imageResponse.status}`);
            }

            const arrayBuffer = await imageResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const contentType = imageResponse.headers.get("content-type") || "image/png";
            const ext = contentType.split("/")[1] || "png";

            const fileBlob = new Blob([buffer], { type: contentType });

            const file = await cli.request("drive/files/create", {
                file: fileBlob,
                name: `food_${Date.now()}.${ext}`
            });

            await cli.request("notes/create", {
                fileIds: [file.id],
                text: "ご飯の時間です"
            });

            console.log(`[${timestamp}] ${imageUrl} を投稿しました。(File ID: ${file.id})`);
        } else {
            console.error(`[${timestamp}] JSONにmessageフィールドが見つかりませんでした。`, data);
        }
    } catch (error) {
        console.error(`[${timestamp}] エラーが発生しました:`, error.message || error);
    }
}

cron.schedule('0 * * * *', async () => {
    await fetchImage();
});

console.log('Botが起動しました。');