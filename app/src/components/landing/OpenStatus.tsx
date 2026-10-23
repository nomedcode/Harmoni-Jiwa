"use client";

import { useClinicNow } from "@/hooks/useClinicNow";
import { openStatus } from "@/lib/office-hours";
import styles from "./OpenStatus.module.css";

export function OpenStatus() {
  const now = useClinicNow();

  if (!now) return <span className={styles.badge} aria-hidden="true">&nbsp;</span>;

  const status = openStatus(now);
  if (status.open) {
    return (
      <span className={`${styles.badge} ${styles.open}`} role="status">
        <span className={styles.dot} aria-hidden="true" />
        Buka sekarang, tutup pukul {status.closes}
      </span>
    );
  }
  return (
    <span className={styles.badge} role="status">
      Tutup, buka {status.today ? "hari ini" : status.nextDay} pukul {status.opens}
    </span>
  );
}
