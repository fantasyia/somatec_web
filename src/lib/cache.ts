import 'server-only';
import {
  revalidateTag as nextRevalidateTag,
  revalidatePath as nextRevalidatePath,
} from 'next/cache';

/**
 * Wrapper local de `revalidateTag`.
 *
 * Next 16 mudou a assinatura para exigir um segundo argumento (profile).
 * Passamos `{ expire: 0 }` para purgar imediatamente — é o comportamento
 * que tínhamos antes em Next 15. Centralizado aqui para que mudanças
 * futuras de API afetem apenas este arquivo.
 */
export function revalidateTag(tag: string): void {
  nextRevalidateTag(tag, { expire: 0 });
}

/**
 * Re-exporta `revalidatePath` sem mudanças. Em Next 16 o `type` voltou a ser
 * opcional; mantemos a assinatura limpa.
 */
export function revalidatePath(path: string, type?: 'page' | 'layout'): void {
  nextRevalidatePath(path, type);
}
