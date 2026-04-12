<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/57535148-1989-4f65-834e-4cff16d06de9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Optionally configure Alibaba Cloud DashScope in `.env.local`:
   - `ALIYUN_DASHSCOPE_API_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation`
   - `ALIYUN_DASHSCOPE_API_KEY` (your DashScope API key)
   - `ALIYUN_DASHSCOPE_MODEL_NAME=qwen-plus` (or other Qwen model)
4. Run the app:
   `npm run dev`
