import {test,expect} from '@playwright/test'
import {createClient} from '@supabase/supabase-js'
import {readFileSync} from 'node:fs'
test('local registration, workspace, confirmation and password recovery',async({page})=>{
 test.skip(!process.env.TEST_LOCAL_AUTH,'Only runs against isolated local Auth')
 const cfg=JSON.parse(readFileSync('/tmp/quolyn-local-status.json','utf8')),admin=createClient(cfg.API_URL,cfg.SERVICE_ROLE_KEY),email=`auth-${Date.now()}@example.invalid`,password='Local-test-'+crypto.randomUUID()
 await page.goto('/auth/login');await page.waitForFunction(()=>document.documentElement.dataset.hydrated==='true')
 await page.getByRole('button',{name:'Create an account',exact:true}).click();await page.getByLabel('Email address').fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Create account →'}).click()
 await expect(page.getByRole('heading',{name:'Your business, your workspace.'})).toBeVisible();await page.getByLabel('Business name').fill('New registration test workspace');await page.getByRole('button',{name:'Create workspace →'}).click();await expect(page.getByRole('heading',{name:'Let’s make your next quote count.'})).toBeVisible();await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.hydrated==='true');await expect(page.getByRole('heading',{name:'Let’s make your next quote count.'})).toBeVisible()
 await page.getByRole('button',{name:'↗ Sign out'}).click();await expect(page).toHaveURL(/auth\/login/)
 const recovery=await admin.auth.admin.generateLink({type:'recovery',email});expect(recovery.error).toBeNull()
 await page.goto(`/api/auth/callback?token_hash=${recovery.data.properties!.hashed_token}&type=recovery`);await page.waitForFunction(()=>document.documentElement.dataset.hydrated==='true');await expect(page.getByRole('heading',{name:'Choose a new password'})).toBeVisible();await page.getByLabel('New password').fill(password+'changed');await page.getByRole('button',{name:'Update password'}).click();await expect(page.getByRole('heading',{name:'Let’s make your next quote count.'})).toBeVisible()
 const confirm=await admin.auth.admin.generateLink({type:'signup',email:`confirm-${Date.now()}@example.invalid`,password});expect(confirm.error).toBeNull();await page.goto(`/api/auth/callback?token_hash=${confirm.data.properties!.hashed_token}&type=signup`);await expect(page.getByRole('heading',{name:'Your business, your workspace.'})).toBeVisible()
})
