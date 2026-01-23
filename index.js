const express = require('express');
const axios = require('axios');
const sharp = require('sharp');
const NodeCache = require('node-cache');

const app = express();
const PORT = 3000;

// Кешуємо дані текстур на 1 годину, а готові картинки на 10 хвилин
const cache = new NodeCache({ stdTTL: 600 });

// Налаштування клієнта для швидких запитів
const http = axios.create({
    timeout: 5000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Minecraft-Skin-Proxy/1.0' }
});

async function getTextures(username) {
    const cacheKey = `textures_${username.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // 1. Ely.By (включає Mojang/Microsoft)
    try {
        const res = await http.get(`https://skinsystem.ely.by/textures/${username}`);
        if (res.data && (res.data.SKIN || res.data.CAPE)) {
            cache.set(cacheKey, res.data, 3600); // Кеш текстур на годину
            return res.data;
        }
    } catch (e) {}

    // 2. TLauncher
    try {
        const res = await http.get(`https://auth.tlauncher.org/skin/profile/texture/login/${username}`, {
            headers: { 'User-Agent': 'TLSkinCape/1.381 (Fabric)' }
        });
        if (res.data && (res.data.SKIN || res.data.CAPE)) {
            cache.set(cacheKey, res.data, 3600);
            return res.data;
        }
    } catch (e) {}

    return null;
}

// 1. JSON Відповідь: /&name&
app.get('/:name', async (req, res, next) => {
    const reserved = ['head', 'skin', 'cape'];
    if (reserved.includes(req.params.name)) return next();
    
    const data = await getTextures(req.params.name);
    if (!data) return res.status(404).json({ error: 'Player not found' });
    res.json(data);
});

// 2. Голова: /head?username=%name%&size=%size%
app.get('/head', async (req, res) => {
    const { username, size = 64 } = req.query;
    if (!username) return res.status(400).send('Missing username');

    const s = parseInt(size);
    const cacheKey = `head_${username.toLowerCase()}_${s}`;
    const cachedImg = cache.get(cacheKey);
    if (cachedImg) {
        res.set('Content-Type', 'image/png');
        return res.send(cachedImg);
    }

    const textures = await getTextures(username);
    if (!textures?.SKIN?.url) return res.status(404).send('Skin not found');

    try {
        const skinRes = await http.get(textures.SKIN.url, { responseType: 'arraybuffer' });
        const skinBuffer = Buffer.from(skinRes.data);

        const baseHead = await sharp(skinBuffer).extract({ left: 8, top: 8, width: 8, height: 8 }).toBuffer();
        const overlay = await sharp(skinBuffer).extract({ left: 40, top: 8, width: 8, height: 8 }).toBuffer();

        const finalHead = await sharp(baseHead)
            .composite([{ input: overlay }])
            .resize(s, s, { kernel: 'nearest' })
            .png()
            .toBuffer();

        cache.set(cacheKey, finalHead);
        res.set('Content-Type', 'image/png');
        res.send(finalHead);
    } catch (err) {
        res.status(500).send('Error processing head');
    }
});

// 3. Скін: /skin?username=%name%
app.get('/skin', async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).send('Missing username');

    const textures = await getTextures(username);
    if (!textures?.SKIN?.url) return res.status(404).send('Skin not found');

    try {
        const response = await http.get(textures.SKIN.url, { responseType: 'arraybuffer' });
        res.set('Content-Type', 'image/png');
        res.send(Buffer.from(response.data));
    } catch (err) {
        res.status(500).send('Error fetching skin');
    }
});

// 4. Плащ: /cape?username=%name%
app.get('/cape', async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).send('Missing username');

    const textures = await getTextures(username);
    if (!textures?.CAPE?.url) return res.status(404).send('Cape not found');

    try {
        const response = await http.get(textures.CAPE.url, { responseType: 'arraybuffer' });
        res.set('Content-Type', 'image/png');
        res.send(Buffer.from(response.data));
    } catch (err) {
        res.status(500).send('Error fetching cape');
    }
});

app.listen(PORT, () => {
    console.log(`--- Minecraft Skin API ---`);
    console.log(`✅ Running at http://localhost:${PORT}`);
    console.log(`🔗 /head?username=Lostya&size=128`);
    console.log(`🔗 /skin?username=Lostya`);
    console.log(`🔗 /Lostya (JSON)`);
});