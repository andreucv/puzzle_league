/**
 * Standardized use:enhance handler factory for SvelteKit form actions.
 * Used by onboarding wizard and profile page to avoid duplicating
 * the submit → success/failure → error-handling pattern.
 */
export function createEnhanceHandler(
    errorSetter: (msg: string | null) => void,
    errorKey: string,
    {
        onSuccess,
        setSubmitting,
    }: {
        onSuccess?: () => void | Promise<void>;
        setSubmitting?: (v: boolean) => void;
    } = {}
) {
    return () => {
        setSubmitting?.(true);
        errorSetter(null);
        return async ({ result, update }: { result: any; update: (opts?: any) => Promise<void> }) => {
            if (result.type === 'success') {
                try {
                    await onSuccess?.();
                } finally {
                    setSubmitting?.(false);
                }
                return;
            }

            setSubmitting?.(false);

            if (result.type === 'failure') {
                const errorMsg = result.data?.[errorKey] || result.data?.error;
                if (errorMsg) {
                    errorSetter(errorMsg as string);
                } else {
                    await update({ reset: false });
                }
            } else {
                await update({ reset: false });
            }
        };
    };
}
