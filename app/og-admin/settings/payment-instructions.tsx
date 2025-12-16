import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useFormState } from 'react-dom';

interface InstructionStep {
  title: string;
  body: string;
}

interface PaymentInstructionsProps {
  initialTitle: string;
  initialSteps: InstructionStep[];
  onSave: (prevState: any, formData: FormData) => Promise<{ message: string }>;
}

export default function PaymentInstructionsEditor({
  initialTitle,
  initialSteps,
  onSave
}: PaymentInstructionsProps) {
  const [title, setTitle] = useState(initialTitle);
  const [steps, setSteps] = useState<InstructionStep[]>(initialSteps);
  const [state, formAction] = useFormState(onSave, { message: '' });

  const addStep = () => {
    setSteps([...steps, { title: `Step ${steps.length + 1}`, body: '' }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof InstructionStep, value: string) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setSteps(updatedSteps);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('steps', JSON.stringify(steps));
    formAction(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Instructions</CardTitle>
        <CardDescription>Configure the payment instructions shown to users</CardDescription>
      </CardHeader>
      <CardContent>
        {state.message && (
          <div className={`mb-4 p-3 rounded-md ${state.message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {state.message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instructions-title">Instructions Title</Label>
            <Input
              id="instructions-title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Payment Instructions"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Instruction Steps</Label>
              <Button type="button" variant="outline" size="sm" onClick={addStep}>
                <Plus className="h-4 w-4 mr-1" />
                Add Step
              </Button>
            </div>

            {steps.map((step, index) => (
              <div key={index} className="border rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Step {index + 1}</h4>
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`step-title-${index}`}>Title</Label>
                  <Input
                    id={`step-title-${index}`}
                    name={`step-title-${index}`}
                    value={step.title}
                    onChange={(e) => updateStep(index, 'title', e.target.value)}
                    placeholder="Step title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`step-body-${index}`}>Description</Label>
                  <Input
                    id={`step-body-${index}`}
                    name={`step-body-${index}`}
                    value={step.body}
                    onChange={(e) => updateStep(index, 'body', e.target.value)}
                    placeholder="Step description"
                  />
                </div>
              </div>
            ))}
          </div>

          <Button type="submit">Save Payment Instructions</Button>
        </form>
      </CardContent>
    </Card>
  );
}
