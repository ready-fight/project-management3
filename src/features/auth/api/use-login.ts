import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { ensureBrowserAppwriteSession } from "@/lib/appwrite-browser";
import { useRouter } from "next/navigation";

type ResponseType = InferResponseType<(typeof client.api.auth.login)["$post"]>;
type RequestType = InferRequestType<(typeof client.api.auth.login)["$post"]>;

export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.auth.login.$post({ json });

      if (!response.ok) {
        throw new Error("Failed to log in.");
      }

      const result = await response.json();

      // The existing HttpOnly server session remains the source of truth for API calls.
      // A second browser session is created only so Appwrite Realtime can authenticate.
      try {
        await ensureBrowserAppwriteSession(json.email, json.password);
      } catch (error) {
        console.warn(
          "Signed in, but browser Appwrite session could not be created for Realtime.",
          error
        );
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Logged in.");
      router.refresh();
      queryClient.invalidateQueries({ queryKey: ["current"] });
    },
    onError: () => {
      toast.error("Failed to log in.");
    },
  });

  return mutation;
};
