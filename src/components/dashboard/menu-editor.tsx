import { useEffect, useRef, useState } from 'react';
import { PencilIcon, PlusIcon, Trash2Icon, UploadIcon } from 'lucide-react';
import { useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import { menuArtOptions } from '~/components/art';
import {
  EmptyState,
  PageHeading,
  useDashboard,
  useDashboardMutation
} from '~/components/dashboard/shell';
import { ItemLabels, MenuArtwork } from '~/components/site/menu-art';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog';
import { Switch } from '~/components/ui/switch';
import { menuCategories } from '~/db/schema';
import type { MenuCategory } from '~/db/schema';
import { formatPrice } from '~/lib/format';
import {
  deleteMenuItem,
  removeMenuPhoto,
  saveMenuItem,
  setMenuItemSoldOut,
  uploadMenuPhoto
} from '~/lib/owner.functions';

export type MenuRow = {
  id: string;
  category: MenuCategory;
  name: string;
  description: string;
  priceCents: number;
  dietary: string[];
  art: string;
  soldOut: boolean;
  featured: boolean;
  photoUrl: string | null;
};

const categoryTitles: Record<MenuCategory, string> = {
  breads: 'Breads',
  pastries: 'Pastries',
  coffee: 'Coffee'
};

const dietaryOptions = ['Vegan', 'Vegetarian', 'Gluten-free', 'Dairy-free', 'Contains nuts'];

/** Shrinks big phone photos before they're sent. Falls back to the original. */
async function preparePhoto(file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1600 / Math.max(bitmap.width, bitmap.height), 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    );
    return blob ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

function parsePrice(value: string) {
  const amount = Number(value.replace(/[$\s,]/g, ''));
  return Number.isFinite(amount) ? Math.round(amount * 100) : Number.NaN;
}

function ItemDialog({
  item,
  open,
  onOpenChange
}: {
  item: MenuRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { readOnly } = useDashboard();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MenuCategory>('breads');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [dietary, setDietary] = useState<string[]>([]);
  const [art, setArt] = useState('boule');
  const [soldOut, setSoldOut] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? '');
    setCategory(item?.category ?? 'breads');
    setPrice(item ? (item.priceCents / 100).toFixed(2) : '');
    setDescription(item?.description ?? '');
    setDietary(item?.dietary ?? []);
    setArt(item?.art ?? 'boule');
    setSoldOut(item?.soldOut ?? false);
    setFeatured(item?.featured ?? false);
    setFile(null);
    setPreview(null);
    setConfirmingDelete(false);
  }, [item, open]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const remove = useDashboardMutation(
    () => deleteMenuItem({ data: { id: item?.id ?? '' } }),
    { success: 'Item deleted' }
  );
  const removePhoto = useDashboardMutation(
    () => removeMenuPhoto({ data: { id: item?.id ?? '' } }),
    { success: 'Photo removed' }
  );

  async function save() {
    if (readOnly) return;
    const priceCents = parsePrice(price);
    if (name.trim().length < 2) {
      toast.error('Enter a name.');
      return;
    }
    if (Number.isNaN(priceCents)) {
      toast.error('Enter a price, like 4.50.');
      return;
    }
    setSaving(true);
    try {
      const { id } = await saveMenuItem({
        data: {
          id: item?.id ?? null,
          category,
          name,
          description,
          priceCents,
          dietary,
          art,
          soldOut,
          featured
        }
      });
      if (file) {
        const form = new FormData();
        form.set('id', id);
        form.set('file', await preparePhoto(file));
        await uploadMenuPhoto({ data: form });
      }
      await router.invalidate();
      toast.success(item ? 'Menu item saved' : 'Menu item added');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'That didn’t save.');
    } finally {
      setSaving(false);
    }
  }

  const shownPhoto = preview ?? item?.photoUrl ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[92svh] gap-0 overflow-y-auto rounded-none border-2 border-ink bg-paper p-0 sm:max-w-xl'>
        <DialogHeader className='border-b-2 border-ink p-5 text-left'>
          <DialogTitle className='display text-4xl font-medium'>
            {readOnly ? 'View item' : item ? 'Edit item' : 'New item'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'This is the editing form owners see. It’s read-only in the demo.'
              : 'Changes appear on the public menu right away.'}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <fieldset disabled={readOnly || saving} className='space-y-4 p-5 disabled:opacity-90'>
            <div className='grid grid-cols-[1fr_7rem] gap-3'>
              <label className='block'>
                <span className='mb-1 block font-semibold'>Name</span>
                <input className='field-input' value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <label className='block'>
                <span className='mb-1 block font-semibold'>Price ($)</span>
                <input
                  className='field-input font-mono'
                  inputMode='decimal'
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                />
              </label>
            </div>
            <label className='block'>
              <span className='mb-1 block font-semibold'>Category</span>
              <select
                className='field-input'
                value={category}
                onChange={(event) => setCategory(event.target.value as MenuCategory)}
              >
                {menuCategories.map((value) => (
                  <option key={value} value={value}>
                    {categoryTitles[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className='block'>
              <span className='mb-1 block font-semibold'>Description</span>
              <textarea
                className='field-input'
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <fieldset>
              <legend className='mb-1.5 font-semibold'>Dietary labels</legend>
              <div className='flex flex-wrap gap-2'>
                {dietaryOptions.map((label) => {
                  const checked = dietary.includes(label);
                  return (
                    <label
                      key={label}
                      className={`relative cursor-pointer border-[1.5px] border-ink px-2.5 py-1.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-crust ${checked ? 'bg-ink text-paper' : ''}`}
                    >
                      <input
                        type='checkbox'
                        className='sr-only'
                        checked={checked}
                        onChange={() =>
                          setDietary((current) =>
                            checked ? current.filter((value) => value !== label) : [...current, label]
                          )
                        }
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div>
              <span className='mb-1.5 block font-semibold'>Photo</span>
              <div className='flex items-start gap-4'>
                <div className='aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-t-full border-[1.5px] border-ink'>
                  <MenuArtwork item={{ name, art, category, photoUrl: shownPhoto, soldOut: false }} />
                </div>
                <div className='min-w-0 flex-1 space-y-2'>
                  <input
                    ref={fileInput}
                    type='file'
                    accept='image/jpeg,image/png,image/webp'
                    className='sr-only'
                    data-testid='photo-input'
                    aria-label='Upload a photo'
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  />
                  <div className='flex flex-wrap gap-2'>
                    <button
                      type='button'
                      className='flex items-center gap-2 border-[1.5px] border-ink px-3 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50'
                      onClick={() => fileInput.current?.click()}
                    >
                      <UploadIcon className='size-4' aria-hidden='true' />
                      {shownPhoto ? 'Replace photo' : 'Upload photo'}
                    </button>
                    {item?.photoUrl && !file ? (
                      <button
                        type='button'
                        className='px-2 py-2 underline underline-offset-4 disabled:opacity-50'
                        disabled={removePhoto.isPending}
                        onClick={() => removePhoto.mutate(undefined)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <p className='text-sm opacity-80'>
                    {file ? `${file.name} will upload when you save.` : 'JPG, PNG, or WebP. Without a photo, the illustration is shown.'}
                  </p>
                </div>
              </div>
            </div>
            <label className='block'>
              <span className='mb-1 block font-semibold'>Illustration</span>
              <select className='field-input' value={art} onChange={(event) => setArt(event.target.value)}>
                {menuArtOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className='grid gap-3 sm:grid-cols-2'>
              <label className='flex items-center justify-between gap-3 border-[1.5px] border-ink p-3 font-semibold'>
                Sold out today
                <Switch checked={soldOut} disabled={readOnly || saving} onCheckedChange={setSoldOut} />
              </label>
              <label className='flex items-center justify-between gap-3 border-[1.5px] border-ink p-3 font-semibold'>
                Feature on home
                <Switch checked={featured} disabled={readOnly || saving} onCheckedChange={setFeatured} />
              </label>
            </div>
          </fieldset>
          <DialogFooter className='m-0 flex-row flex-wrap items-center justify-between gap-3 rounded-none border-t-2 border-ink bg-paper-deep p-5 sm:justify-between'>
            {readOnly ? (
              <p className='font-medium'>Read-only demo</p>
            ) : item ? (
              confirmingDelete ? (
                <span className='flex items-center gap-3'>
                  <button
                    type='button'
                    className='font-semibold text-destructive underline underline-offset-4'
                    disabled={remove.isPending}
                    onClick={() =>
                      remove.mutate(undefined, { onSuccess: () => onOpenChange(false) })
                    }
                  >
                    Delete this item
                  </button>
                  <button type='button' className='underline underline-offset-4' onClick={() => setConfirmingDelete(false)}>
                    Keep
                  </button>
                </span>
              ) : (
                <button
                  type='button'
                  className='flex items-center gap-1.5 underline underline-offset-4'
                  onClick={() => setConfirmingDelete(true)}
                >
                  <Trash2Icon className='size-4' aria-hidden='true' />
                  Delete
                </button>
              )
            ) : (
              <span />
            )}
            {readOnly ? (
              <button type='button' className='btn btn-ghost !min-h-11 !py-2' onClick={() => onOpenChange(false)}>
                Close
              </button>
            ) : (
              <button type='submit' className='btn btn-primary !min-h-11 !py-2' disabled={saving}>
                {saving ? 'Saving…' : 'Save item'}
              </button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SoldOutSwitch({ item }: { item: MenuRow }) {
  const { readOnly } = useDashboard();
  const update = useDashboardMutation((soldOut: boolean) =>
    setMenuItemSoldOut({ data: { id: item.id, soldOut } })
  );
  const checked = update.isPending && update.variables !== undefined ? update.variables : item.soldOut;
  return (
    <label className='flex items-center gap-2 text-sm font-medium whitespace-nowrap'>
      Sold out
      <Switch
        checked={checked}
        disabled={readOnly || update.isPending}
        aria-label={`${item.name} sold out`}
        onCheckedChange={(value) => update.mutate(value)}
      />
    </label>
  );
}

export function MenuEditorView({ items }: { items: MenuRow[] }) {
  const { readOnly } = useDashboard();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const editing = items.find((item) => item.id === editingId) ?? null;

  return (
    <>
      <PageHeading eyebrow={`${items.length} items`} title='Menu'>
        <button
          type='button'
          className='btn btn-primary !min-h-11 !py-2'
          disabled={readOnly}
          onClick={() => {
            setEditingId(null);
            setOpen(true);
          }}
        >
          <PlusIcon className='size-4' aria-hidden='true' />
          Add item
        </button>
      </PageHeading>

      {items.length === 0 ? (
        <EmptyState title='The menu is empty'>Add your first item to get started.</EmptyState>
      ) : null}

      <div className='space-y-9'>
        {menuCategories.map((category) => {
          const rows = items.filter((item) => item.category === category);
          if (!rows.length) return null;
          return (
            <section key={category} aria-labelledby={`editor-${category}`}>
              <h2 id={`editor-${category}`} className='mb-2 text-3xl font-medium'>
                {categoryTitles[category]}
              </h2>
              <ul className='border-t-2 border-ink'>
                {rows.map((item) => (
                  <li
                    key={item.id}
                    className='grid grid-cols-[3.5rem_1fr] items-center gap-x-3 gap-y-2 border-b border-ink/30 py-3 sm:grid-cols-[3.5rem_1fr_auto_auto]'
                    data-menu-item={item.id}
                  >
                    <div className='row-span-2 aspect-[4/5] self-start overflow-hidden rounded-t-full border-[1.5px] border-ink sm:row-span-1'>
                      <MenuArtwork item={{ ...item, soldOut: false }} />
                    </div>
                    <div className='min-w-0'>
                      <p className='flex items-baseline gap-2'>
                        <span className='truncate text-lg font-semibold'>{item.name}</span>
                        <span className='font-mono'>{formatPrice(item.priceCents)}</span>
                      </p>
                      <div className='mt-1'>
                        <ItemLabels dietary={item.dietary} soldOut={false} />
                      </div>
                    </div>
                    <div className='col-start-2 flex items-center justify-between gap-5 sm:col-start-auto sm:contents'>
                      <SoldOutSwitch item={item} />
                      <button
                        type='button'
                        className='flex items-center gap-1.5 border-[1.5px] border-ink px-3 py-1.5 font-semibold'
                        aria-label={`${readOnly ? 'View' : 'Edit'} ${item.name}`}
                        onClick={() => {
                          setEditingId(item.id);
                          setOpen(true);
                        }}
                      >
                        <PencilIcon className='size-3.5' aria-hidden='true' />
                        {readOnly ? 'View' : 'Edit'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <ItemDialog item={editing} open={open} onOpenChange={setOpen} />
    </>
  );
}
