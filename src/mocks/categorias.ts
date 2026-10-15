import { DB, clone, delay } from "@/mocks/db";

export async function getCategorias() {
  return delay(clone(DB.categorias));
}

export async function getSubcategoriasPorCategoria(categoriaId: string | number) {
  const id = Number(categoriaId);
  return delay(clone(DB.subcategorias.filter((s) => s.categoria_id === id)));
}
