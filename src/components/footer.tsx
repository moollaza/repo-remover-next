import {
  faBluesky,
  faGithub,
  faLinkedin,
  faReddit,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "@heroui/react";

export default function Footer() {
  return (
    <footer className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold mb-2">
          Mady by{" "}
          <Link
            className="text-lg font-semibold mb-2"
            href="https://zaahir.ca"
            isExternal
          >
            Zaahir Moolla
          </Link>
        </h3>
        <p className="text-sm ">© 2019 All rights reserved.</p>
      </div>
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2">Contribute</h3>
        <Link
          aria-label="GitHub"
          color="foreground"
          href="https://github.com/moollaza/repo-remover"
          isExternal
        >
          <FontAwesomeIcon className="fa-fw text-xl" icon={faGithub} />
          {""}
          GitHub
        </Link>
      </div>
      <div className="flex flex-col items-end">
        <h3 className="text-lg font-semibold mb-2">Share</h3>
        <div className="flex space-x-4 ">
          <Link
            aria-label="Bluesky"
            color="foreground"
            href="https://bsky.app"
            isExternal
          >
            <FontAwesomeIcon className="fa-fw text-xl" icon={faBluesky} />
          </Link>
          <Link
            aria-label="Reddit"
            color="foreground"
            href="https://reddit.com"
            isExternal
          >
            <FontAwesomeIcon className="fa-fw text-xl" icon={faReddit} />
          </Link>
          <Link
            aria-label="X"
            color="foreground"
            href="https://x.com"
            isExternal
          >
            <FontAwesomeIcon className="fa-fw text-xl" icon={faXTwitter} />
          </Link>
          <Link
            aria-label="LinkedIn"
            color="foreground"
            href="https://linkedin.com"
            isExternal
          >
            <FontAwesomeIcon className="fa-fw text-xl" icon={faLinkedin} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
