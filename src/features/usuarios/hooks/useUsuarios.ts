import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as usuariosService from "@/mocks/usuarios";

const QUERY_KEY = ["usuarios"];

export function useUsuarios() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: usuariosService.getUsuarios,
  });
}

export function useCreateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usuariosService.createUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usuariosService.deleteUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateUsuarioRol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rol }: { id: string; rol: string }) =>
      usuariosService.updateUsuarioRol(id, rol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
