class KuotaPenuhError(Exception):
    """Exception yang dinaikkan ketika kuota paket wisata sudah penuh."""
    def __init__(self, message="Kuota paket wisata sudah penuh."):
        self.message = message
        super().__init__(self.message)

class JadwalPerjalananBentrokError(Exception):
    """Exception yang dinaikkan ketika jadwal perjalanan bentrok dengan jadwal lain."""
    def __init__(self, message="Jadwal perjalanan bentrok."):
        self.message = message
        super().__init__(self.message)
