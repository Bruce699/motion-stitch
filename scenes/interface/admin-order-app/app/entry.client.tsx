if (import.meta.env.DEV) {
  const { scan } = await import('react-scan');

  scan({
    enabled: true,
    showToolbar: true,
  });
}

const [{ startTransition, StrictMode }, { hydrateRoot }, { HydratedRouter }] =
  await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('react-router/dom'),
  ]);

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
