"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { useActionState } from 'react';

interface PaymentMethod {
  image: string;
  title: string;
  phoneNumber: string;
  name: string;
  color: string;
}

interface PaymentMethodsProps {
  initialTitle: string;
  initialPaymentMethods: PaymentMethod[];
  onSave: (formData: FormData) => Promise<any>;
}

export default function PaymentMethodsEditor({
  initialTitle,
  initialPaymentMethods,
  onSave
}: PaymentMethodsProps) {
  const [title, setTitle] = useState(initialTitle);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);
  const [state, formAction] = useActionState(onSave, { message: '' });

  const addPaymentMethod = () => {
    setPaymentMethods([...paymentMethods, { 
      image: '', 
      title: `Payment Method ${paymentMethods.length + 1}`, 
      phoneNumber: '', 
      name: '',
      color: '#000000'
    }]);
  };

  const removePaymentMethod = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const updatePaymentMethod = (index: number, field: keyof PaymentMethod, value: string) => {
    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = { ...updatedMethods[index], [field]: value };
    setPaymentMethods(updatedMethods);
  };

  const createFormData = () => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('paymentMethods', JSON.stringify(paymentMethods));
    return formData;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Configure the payment methods shown to users</CardDescription>
      </CardHeader>
      <CardContent>
        {state.message && (
          <div className={`mb-4 p-3 rounded-md ${state.message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {state.message}
          </div>
        )}
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instructions-title">Instructions Title</Label>
            <Input
              id="instructions-title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Payment Methods"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Payment Methods</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPaymentMethod}>
                <Plus className="h-4 w-4 mr-1" />
                Add Payment Method
              </Button>
            </div>

            {paymentMethods.map((method, index) => (
              <div key={index} className="border rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Payment Method {index + 1}</h4>
                  {paymentMethods.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePaymentMethod(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`method-title-${index}`}>Title</Label>
                    <Input
                      id={`method-title-${index}`}
                      name={`method-title-${index}`}
                      value={method.title}
                      onChange={(e) => updatePaymentMethod(index, 'title', e.target.value)}
                      placeholder="Payment method title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`method-name-${index}`}>Name</Label>
                    <Input
                      id={`method-name-${index}`}
                      name={`method-name-${index}`}
                      value={method.name}
                      onChange={(e) => updatePaymentMethod(index, 'name', e.target.value)}
                      placeholder="Account name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`method-phone-${index}`}>Phone Number</Label>
                    <Input
                      id={`method-phone-${index}`}
                      name={`method-phone-${index}`}
                      value={method.phoneNumber}
                      onChange={(e) => updatePaymentMethod(index, 'phoneNumber', e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`method-image-${index}`}>Image URL</Label>
                    <div className="relative">
                      <Input
                        id={`method-image-${index}`}
                        name={`method-image-${index}`}
                        value={method.image}
                        onChange={(e) => updatePaymentMethod(index, 'image', e.target.value)}
                        placeholder="Image URL"
                        className="pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ImageIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`method-color-${index}`}>Brand Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id={`method-color-${index}`}
                        name={`method-color-${index}`}
                        value={method.color}
                        onChange={(e) => updatePaymentMethod(index, 'color', e.target.value)}
                        placeholder="#000000"
                        className="flex-grow"
                      />
                      <div 
                        className="w-10 h-10 rounded border border-gray-300" 
                        style={{ backgroundColor: method.color }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button 
            type="submit" 
            onClick={(e) => {
              e.preventDefault();
              const formData = createFormData();
              formAction(formData);
            }}
          >
            Save Payment Methods
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
