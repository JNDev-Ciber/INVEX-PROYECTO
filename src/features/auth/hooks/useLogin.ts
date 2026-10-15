import { useMutation } from "@tanstack/react-query";
import { loginWithCredentials } from "@/mocks/auth";

export function useLogin() {
  return useMutation({
    mutationFn: loginWithCredentials,
  });
}
