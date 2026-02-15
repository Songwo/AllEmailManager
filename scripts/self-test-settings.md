# Settings / Security / Notification 自测清单

## 1. 个人资料（头像 + 密码）
1. 打开 `/dashboard/settings`，进入“个人资料”。
2. 上传头像（<1MB 的 jpg/png），点击“保存更改”。
3. 预期：
   - 侧边栏头像即时更新。
   - 刷新页面后头像仍存在。
4. 修改密码并保存。
5. 预期：
   - 使用新密码可重新登录。

## 2. 消息通知 + 飞书模板
1. 进入“消息通知”，切换通知开关并保存。
2. 刷新后确认设置仍保留。
3. 在“飞书卡片模板”中选择模板，点击“一键应用”。
4. 预期：
   - `/api/feishu-templates` 返回应用成功。
   - `/dashboard/channels` 对应飞书渠道可看到模板关联。

## 3. 安全设置（Google 2FA）
1. 点击“开始绑定”，扫描二维码到 Google Authenticator。
2. 输入 6 位验证码，点击“验证并启用 2FA”。
3. 登出后重新登录，预期进入 2FA 验证阶段。
4. 输入动态码或恢复码，登录成功。
5. 在安全页测试“重置恢复码”与“停用 2FA”。

## 4. 右上角铃铛消息中心
1. 保存任意设置、启用/停用 2FA、应用模板。
2. 点击右上角铃铛。
3. 预期：
   - 新消息可见且未读数增加。
   - 点击消息后变为已读。
   - “全部已读”可清空未读计数。

## 5. API 快速自测（可选）
> 以下命令假设你已登录并拿到 `TOKEN`。

```bash
# 读取设置
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/settings

# 读取通知
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/notifications?limit=10"

# 标记全部已读
curl -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"markAllRead":true}' http://localhost:3000/api/notifications

# 拉取飞书内置模板
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/feishu-templates

# 2FA 状态
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/settings/2fa
```
