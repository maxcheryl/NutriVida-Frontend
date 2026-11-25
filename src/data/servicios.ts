/** Devuelve las clases visuales que corresponden a cada categoría. */
export function getBadgeClass(tipo: string): string {
  const classes: Record<string, string> = {
    Consulta: 'bg-success text-white',
    'Plan especializado': 'bg-primary text-white',
    Evaluación: 'bg-warning text-dark',
    'Taller grupal': 'bg-info text-dark',
  }
  return classes[tipo] || 'bg-secondary text-white'
}

/** Devuelve el icono que corresponde a cada categoría. */
export function getTipoIcon(tipo: string): string {
  const icons: Record<string, string> = {
    Consulta: 'bi-person-heart',
    'Plan especializado': 'bi-journal-medical',
    Evaluación: 'bi-clipboard2-pulse',
    'Taller grupal': 'bi-people',
  }
  return icons[tipo] || 'bi-tag'
}
