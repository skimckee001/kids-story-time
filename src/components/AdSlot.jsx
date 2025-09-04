import { useEffect, useRef } from "react";

export default function AdSlot({
  client = "ca-pub-1413183979906947",
  slot = "1977532623",
  format = "auto",
  responsive = "true",
  className = "",
}) {
  const insRef = useRef(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    const el = insRef.current;
    if (!el) return;

    // If AdSense script isn't present yet, bail (component will still render harmlessly)
    if (typeof window === "undefined" || !window.adsbygoogle) return;

    // Don't push twice to the same ins (StrictMode / rerenders / route changes)
    if (pushedRef.current || el.dataset.adStatus === "filled") return;

    // Wait for minimum width before pushing (AdSense needs at least 250px for responsive ads)
    const MIN_WIDTH = 250;
    
    const tryPushAd = () => {
      // Check if element has sufficient width
      const currentWidth = el.offsetWidth || el.parentElement?.offsetWidth || 0;
      if (currentWidth < MIN_WIDTH) {
        // Wait a bit and try again
        setTimeout(tryPushAd, 200);
        return;
      }

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
        el.dataset.adStatus = "filled";
      } catch (e) {
        // If it's a width issue, retry once more
        if (e.message && e.message.includes("No slot size")) {
          setTimeout(() => {
            if (!pushedRef.current) {
              try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                pushedRef.current = true;
                el.dataset.adStatus = "filled";
              } catch (e2) {
                console.warn("AdSense retry failed:", e2);
              }
            }
          }, 500);
        }
      }
    };

    // Optional: only push when the slot is on screen to reduce layout jank
    const io = new IntersectionObserver((entries) => {
      const visible = entries.some((e) => e.isIntersecting);
      if (!visible) return;
      
      io.disconnect();
      tryPushAd();
    }, { root: null, threshold: 0.1 });

    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Only set data-ad-test in dev/localhost
  const isDev = typeof window !== "undefined" &&
    (process.env.NODE_ENV === "development" || window.location.hostname === "localhost");

  return (
    <div
      style={{
        margin: "40px auto",
        padding: "20px",
        background: "#f9f9f9",
        border: "1px solid #e5e5e5",
        borderRadius: "12px",
        maxWidth: "728px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#999",
          marginBottom: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          fontWeight: "500",
        }}
      >
        Advertisement
      </div>

      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{
          display: "block",
          minHeight: "90px",
          width: "100%",
        }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
        {...(isDev ? { "data-ad-test": "on" } : {})}
      />
    </div>
  );
}