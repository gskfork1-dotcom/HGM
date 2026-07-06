export function Footer() {
  return (
    <footer className="border-t border-hgm-sapphire/10 bg-hgm-dark-bg">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-bold text-white">HGM</h3>
            <p className="mt-2 text-sm text-hgm-slate-grey">
              Hidup Ginjal Muda — Platform premium pendamping Hemodialisis & CAPD.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white">Navigasi</h4>
            <ul className="mt-2 space-y-1 text-sm text-hgm-slate-grey">
              <li>Beranda</li>
              <li>HGM Academy</li>
              <li>Tentang Kami</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white">Kontak</h4>
            <p className="mt-2 text-sm text-hgm-slate-grey">
              info@hidupginjalmuda.com
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-hgm-sapphire/20 pt-6 text-center text-xs text-hgm-slate-grey">
          &copy; {new Date().getFullYear()} HGM — Hidup Ginjal Muda. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
