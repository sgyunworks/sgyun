import Image from "next/image";
import { IPhone17ProMockup } from "./IPhone17ProMockup";
import styles from "./MobileAppShowcase.module.css";

type ShowcaseMedia = {
  src: string;
  altText: string;
};

type ShowcaseChapter = {
  code: string;
  title: string;
  body: string;
};

export function MobileAppShowcase({
  media,
  chapters,
  locale,
}: {
  media: ShowcaseMedia[];
  chapters: ShowcaseChapter[];
  locale: "ko" | "en";
}) {
  const screens = media.slice(0, 3);

  return (
    <section
      id="project-process"
      className={styles.showcase}
      data-mobile-app-visual="true"
      aria-label={locale === "ko" ? "RecoPick 제품 흐름" : "RecoPick product flow"}
    >
      <div className={styles.header}>
        <span>D / PRODUCT FLOW</span>
        <p>
          {locale === "ko"
            ? "긴 목록을 줄이고, 선택을 끝내는 세 장면."
            : "Three moments that reduce the list and finish the choice."}
        </p>
        <small>IPHONE 17 PRO / 03 SCREENS</small>
      </div>

      <div className={styles.stage}>
        {screens.map((screen, index) => (
          <figure className={styles.figure} data-screen={index + 1} key={screen.src}>
            <IPhone17ProMockup className={styles.phone}>
              <Image
                src={screen.src}
                alt={screen.altText}
                fill
                sizes="(max-width: 600px) 66vw, (max-width: 1100px) 34vw, 25vw"
                className={styles.screenImage}
              />
            </IPhone17ProMockup>
            {chapters[index] ? (
              <figcaption>
                <small>{chapters[index].code}</small>
                <strong>{chapters[index].title}</strong>
                <p>{chapters[index].body}</p>
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  );
}
