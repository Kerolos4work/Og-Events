"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const VENUE_ID = "6667da4b-66e0-4d85-ba78-d65ed67dc85c";

export async function getVenueData() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('venues')
        .select('categories')
        .eq('id', VENUE_ID)
        .single();

    if (error) {
        console.error('Error fetching venue data:', error);
        throw new Error(error.message);
    }

    return data;
}

export async function saveTicketTemplate(categoryName: string, template: any) {
    const supabase = await createClient();

    // 1. Get current categories
    const { data, error: fetchError } = await supabase
        .from('venues')
        .select('categories')
        .eq('id', VENUE_ID)
        .single();

    if (fetchError) throw new Error(fetchError.message);

    const categories = data.categories || [];

    // 2. Update the specific category with the new template (replacing all existing ones)
    const updatedCategories = categories.map((cat: any) => {
        if (cat.name === categoryName) {
            // Replace everything with just this one template
            return { ...cat, templates: [template] };
        }
        return cat;
    });

    // 3. Save back to database
    const { error: updateError } = await supabase
        .from('venues')
        .update({ categories: updatedCategories })
        .eq('id', VENUE_ID);

    if (updateError) throw new Error(updateError.message);

    revalidatePath('/admin/tickets'); // Adjust path as needed
    return { success: true };
}

export async function deleteTicketTemplate(categoryName: string, templateName: string) {
    const supabase = await createClient();

    const { data, error: fetchError } = await supabase
        .from('venues')
        .select('categories')
        .eq('id', VENUE_ID)
        .single();

    if (fetchError) throw new Error(fetchError.message);

    const categories = data.categories || [];

    const updatedCategories = categories.map((cat: any) => {
        if (cat.name === categoryName) {
            const existingTemplates = cat.templates || [];
            const filteredTemplates = existingTemplates.filter((t: any) => t.name !== templateName);
            return { ...cat, templates: filteredTemplates };
        }
        return cat;
    });

    const { error: updateError } = await supabase
        .from('venues')
        .update({ categories: updatedCategories })
        .eq('id', VENUE_ID);

    if (updateError) throw new Error(updateError.message);

    revalidatePath('/admin/tickets');
    return { success: true };
}
