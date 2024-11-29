import { Link } from "@nextui-org/react";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faLinkedin,
  faBluesky,
  faXTwitter,
  faReddit,
} from "@fortawesome/free-brands-svg-icons";

export default function Footer({ className = "" }) {
  return (
    <footer className={clsx("w-full py-8 px-6 bg-gray-100", className)}>
      <div className="container mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold mb-2">
            Mady by{" "}
            <Link
              href="https://zaahir.ca"
              isExternal
              className="text-lg font-semibold mb-2"
            >
              Zaahir Moolla
            </Link>
          </h3>
          <p className="text-sm ">© 2019 All rights reserved.</p>
        </div>
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-2">Contribute</h3>
          <Link
            href="https://github.com/moollaza/repo-remover"
            isExternal
            color="foreground"
            aria-label="GitHub"
          >
            <FontAwesomeIcon icon={faGithub} className="fa-fw text-xl" />
            {""}
            GitHub
          </Link>
        </div>
        <div className="flex flex-col items-end">
          <h3 className="text-lg font-semibold mb-2">Share</h3>
          <div className="flex space-x-4 ">
            <Link
              href="https://bsky.app"
              isExternal
              color="foreground"
              aria-label="Bluesky"
            >
              <FontAwesomeIcon icon={faBluesky} className="fa-fw text-xl" />
            </Link>
            <Link
              href="https://reddit.com"
              isExternal
              color="foreground"
              aria-label="Reddit"
            >
              <FontAwesomeIcon icon={faReddit} className="fa-fw text-xl" />
            </Link>
            <Link
              href="https://x.com"
              isExternal
              color="foreground"
              aria-label="X"
            >
              <FontAwesomeIcon icon={faXTwitter} className="fa-fw text-xl" />
            </Link>
            <Link
              href="https://linkedin.com"
              isExternal
              color="foreground"
              aria-label="LinkedIn"
            >
              <FontAwesomeIcon icon={faLinkedin} className="fa-fw text-xl" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
