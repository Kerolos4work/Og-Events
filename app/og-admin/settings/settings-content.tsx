import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { redirect } from 'next/navigation';
import { updateSettings, goToDashboard, logout } from './actions';
import { updatePaymentInstructions } from './update-payment-instructions';
import PaymentMethodsEditor from './payment-methods-editor';
import PaymentModeForm from './payment-mode-form';
import fs from 'fs';
import { isUserAdmin } from '@/lib/auth';
import path from 'path';
import settingsData from '../../../config/settings.json';

export default async function SettingsContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user, redirect to login
  if (!user) {
    redirect('/auth/login');
  }

  // Check if the user is an authorized admin
  if (!isUserAdmin(user)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You are not authorized to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <form action={goToDashboard}>
              <Button type="submit" variant="outline">
                Back to Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get(
        'success'
      ) && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">Settings updated successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Configure general application settings</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateSettings} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-name">Site Name</Label>
                <Input id="site-name" name="site-name" defaultValue="OG Event" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-description">Site Description</Label>
                <Input
                  id="site-description"
                  name="site-description"
                  defaultValue="Event Management Platform"
                />
              </div>
              <Button type="submit">Save Changes</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
            <CardDescription>Configure payment processing options</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentModeForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
            <CardDescription>Configure email notification settings</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateSettings} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input
                  id="admin-email"
                  name="admin-email"
                  type="email"
                  defaultValue={user.email || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notification-email">Notification Email</Label>
                <Input
                  id="notification-email"
                  name="notification-email"
                  type="email"
                  defaultValue="notifications@example.com"
                />
              </div>
              <Button type="submit">Save Changes</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {settingsData.payment.mode === "manual" && (
        <div className="mt-6">
          <PaymentMethodsEditor
            initialTitle={settingsData.payment.instructions.title}
            initialPaymentMethods={settingsData.payment.instructions.paymentMethods}
            onSave={updatePaymentInstructions}
          />
        </div>
      )}

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage security and authentication settings</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateSettings} className="space-y-4">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="two-factor" name="two-factor" className="rounded" />
                <Label htmlFor="two-factor">Enable Two-Factor Authentication</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="session-timeout"
                  name="session-timeout"
                  defaultChecked
                  className="rounded"
                />
                <Label htmlFor="session-timeout">Enable Session Timeout</Label>
              </div>
              <Button type="submit">Update Security Settings</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex justify-between">
        <form action={goToDashboard}>
          <Button type="submit" variant="outline">
            Back to Dashboard
          </Button>
        </form>
        <form action={logout}>
          <Button type="submit" variant="outline">
            Logout
          </Button>
        </form>
      </div>
    </div>
  );
}
