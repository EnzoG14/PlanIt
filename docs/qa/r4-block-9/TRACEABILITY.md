# R4 B9 · Trazabilidad y aceptación

Los resultados SQL y navegador son locales/fixtures. Aceptación humana: **39/39 Validado**, por pruebas manuales completas declaradas por el responsable ([acta](human-acceptance.json)). HTTP JWT funcional ejecutado por el agente: **NOT RUN**; no se inventan resultados por escenario.

| CA | Resultado local | Estado | Caso reproducible |
| --- | --- | --- | --- |
| RF-R4-01.CA-01 | PASS | Validado | [npm run check:search](../../../scripts/check-search.mjs) · [npm run check:search:ui](../../../scripts/check-search-ui.mjs) |
| RF-R4-01.CA-02 | PASS | Validado | [npm run check:search](../../../scripts/check-search.mjs) · [npm run check:search:ui](../../../scripts/check-search-ui.mjs) |
| RF-R4-01.CA-03 | PASS | Validado | [npm run check:search](../../../scripts/check-search.mjs) · [npm run check:search:ui](../../../scripts/check-search-ui.mjs) |
| RF-R4-01.CA-04 | PASS | Validado | [npm run check:search](../../../scripts/check-search.mjs) · [npm run check:search:ui](../../../scripts/check-search-ui.mjs) |
| RF-R4-02.CA-01 | PASS | Validado | [npm run check:search](../../../scripts/check-search.mjs) · [npm run check:search:ui](../../../scripts/check-search-ui.mjs) · [npm run check:filters:ui](../../../scripts/check-filters-ui.mjs) |
| RF-R4-02.CA-02 | PASS | Validado | [npm run check:search](../../../scripts/check-search.mjs) · [npm run check:search:ui](../../../scripts/check-search-ui.mjs) · [npm run check:filters:ui](../../../scripts/check-filters-ui.mjs) |
| RF-R4-02.CA-03 | PASS | Validado | [npm run check:search](../../../scripts/check-search.mjs) · [npm run check:search:ui](../../../scripts/check-search-ui.mjs) · [npm run check:filters:ui](../../../scripts/check-filters-ui.mjs) |
| RF-R4-02.CA-04 | PASS | Validado | [npm run check:search](../../../scripts/check-search.mjs) · [npm run check:search:ui](../../../scripts/check-search-ui.mjs) · [npm run check:filters:ui](../../../scripts/check-filters-ui.mjs) |
| RF-R4-03.CA-01 | PASS | Validado | [npm run check:search](../../../scripts/check-search.mjs) · [npm run check:filters:ui](../../../scripts/check-filters-ui.mjs) · [npm run check:r4:boundaries](../../../scripts/check-r4-boundaries.mjs) |
| RF-R4-03.CA-02 | PASS | Validado | [npm run check:search](../../../scripts/check-search.mjs) · [npm run check:filters:ui](../../../scripts/check-filters-ui.mjs) · [npm run check:r4:boundaries](../../../scripts/check-r4-boundaries.mjs) |
| RF-R4-03.CA-03 | PASS | Validado | [npm run check:search](../../../scripts/check-search.mjs) · [npm run check:filters:ui](../../../scripts/check-filters-ui.mjs) · [npm run check:r4:boundaries](../../../scripts/check-r4-boundaries.mjs) |
| RF-R4-03.CA-04 | PASS | Validado | [npm run check:search](../../../scripts/check-search.mjs) · [npm run check:filters:ui](../../../scripts/check-filters-ui.mjs) · [npm run check:r4:boundaries](../../../scripts/check-r4-boundaries.mjs) |
| RF-R4-04.CA-01 | PASS | Validado | [npm run check:search](../../../scripts/check-search.mjs) · [npm run check:filters:ui](../../../scripts/check-filters-ui.mjs) · [npm run check:r4:boundaries](../../../scripts/check-r4-boundaries.mjs) |
| RF-R4-04.CA-02 | PASS | Validado | [npm run check:search](../../../scripts/check-search.mjs) · [npm run check:filters:ui](../../../scripts/check-filters-ui.mjs) · [npm run check:r4:boundaries](../../../scripts/check-r4-boundaries.mjs) |
| RF-R4-04.CA-03 | PASS | Validado | [npm run check:search](../../../scripts/check-search.mjs) · [npm run check:filters:ui](../../../scripts/check-filters-ui.mjs) · [npm run check:r4:boundaries](../../../scripts/check-r4-boundaries.mjs) |
| RF-R4-04.CA-04 | PASS | Validado | [npm run check:search](../../../scripts/check-search.mjs) · [npm run check:filters:ui](../../../scripts/check-filters-ui.mjs) · [npm run check:r4:boundaries](../../../scripts/check-r4-boundaries.mjs) |
| RF-R4-05.CA-01 | PASS | Validado | [npm run check:interests](../../../scripts/check-interests.mjs) · [npm run check:interests:ui](../../../scripts/check-interests-ui.mjs) |
| RF-R4-05.CA-02 | PASS | Validado | [npm run check:interests](../../../scripts/check-interests.mjs) · [npm run check:interests:ui](../../../scripts/check-interests-ui.mjs) |
| RF-R4-05.CA-03 | PASS | Validado | [npm run check:interests](../../../scripts/check-interests.mjs) · [npm run check:interests:ui](../../../scripts/check-interests-ui.mjs) |
| RF-R4-05.CA-04 | PASS | Validado | [npm run check:interests](../../../scripts/check-interests.mjs) · [npm run check:interests:ui](../../../scripts/check-interests-ui.mjs) |
| RF-R4-06.CA-01 | PASS | Validado | [npm run check:suggestions](../../../scripts/check-suggestions.mjs) · [npm run check:suggestions:ui](../../../scripts/check-suggestions-ui.mjs) |
| RF-R4-06.CA-02 | PASS | Validado | [npm run check:suggestions](../../../scripts/check-suggestions.mjs) · [npm run check:suggestions:ui](../../../scripts/check-suggestions-ui.mjs) |
| RF-R4-06.CA-03 | PASS | Validado | [npm run check:suggestions](../../../scripts/check-suggestions.mjs) · [npm run check:suggestions:ui](../../../scripts/check-suggestions-ui.mjs) |
| RF-R4-06.CA-04 | PASS | Validado | [npm run check:suggestions](../../../scripts/check-suggestions.mjs) · [npm run check:suggestions:ui](../../../scripts/check-suggestions-ui.mjs) |
| RF-R4-07.CA-01 | PASS | Validado | [npm run check:event-links](../../../scripts/check-event-links.mjs) · [npm run check:event-links:ui](../../../scripts/check-event-links-ui.mjs) · [npm run check:invite](../../../scripts/check-invite.mjs) |
| RF-R4-07.CA-02 | PASS | Validado | [npm run check:event-links](../../../scripts/check-event-links.mjs) · [npm run check:event-links:ui](../../../scripts/check-event-links-ui.mjs) · [npm run check:invite](../../../scripts/check-invite.mjs) |
| RF-R4-07.CA-03 | PASS | Validado | [npm run check:event-links](../../../scripts/check-event-links.mjs) · [npm run check:event-links:ui](../../../scripts/check-event-links-ui.mjs) · [npm run check:invite](../../../scripts/check-invite.mjs) |
| RF-R4-07.CA-04 | PASS | Validado | [npm run check:event-links](../../../scripts/check-event-links.mjs) · [npm run check:event-links:ui](../../../scripts/check-event-links-ui.mjs) · [npm run check:invite](../../../scripts/check-invite.mjs) |
| RF-R4-07.CA-05 | PASS | Validado | [npm run check:event-links](../../../scripts/check-event-links.mjs) · [npm run check:event-links:ui](../../../scripts/check-event-links-ui.mjs) · [npm run check:invite](../../../scripts/check-invite.mjs) |
| RF-R4-08.CA-01 | PASS | Validado | [npm run check:invite](../../../scripts/check-invite.mjs) · [npm run check:invite:ui](../../../scripts/check-invite-ui.mjs) · [npm run check:hidden-access](../../../scripts/check-hidden-access.mjs) |
| RF-R4-08.CA-02 | PASS | Validado | [npm run check:invite](../../../scripts/check-invite.mjs) · [npm run check:invite:ui](../../../scripts/check-invite-ui.mjs) · [npm run check:hidden-access](../../../scripts/check-hidden-access.mjs) |
| RF-R4-08.CA-03 | PASS | Validado | [npm run check:invite](../../../scripts/check-invite.mjs) · [npm run check:invite:ui](../../../scripts/check-invite-ui.mjs) · [npm run check:hidden-access](../../../scripts/check-hidden-access.mjs) |
| RF-R4-08.CA-04 | PASS | Validado | [npm run check:invite](../../../scripts/check-invite.mjs) · [npm run check:invite:ui](../../../scripts/check-invite-ui.mjs) · [npm run check:hidden-access](../../../scripts/check-hidden-access.mjs) |
| RF-R4-08.CA-05 | PASS | Validado | [npm run check:invite](../../../scripts/check-invite.mjs) · [npm run check:invite:ui](../../../scripts/check-invite-ui.mjs) · [npm run check:hidden-access](../../../scripts/check-hidden-access.mjs) |
| RF-R4-09.CA-01 | PASS | Validado | [npm run check:event-access](../../../scripts/check-event-access.mjs) · [npm run check:event-access:ui](../../../scripts/check-event-access-ui.mjs) · [npm run check:invite](../../../scripts/check-invite.mjs) |
| RF-R4-09.CA-02 | PASS | Validado | [npm run check:event-access](../../../scripts/check-event-access.mjs) · [npm run check:event-access:ui](../../../scripts/check-event-access-ui.mjs) · [npm run check:invite](../../../scripts/check-invite.mjs) |
| RF-R4-09.CA-03 | PASS | Validado | [npm run check:event-access](../../../scripts/check-event-access.mjs) · [npm run check:event-access:ui](../../../scripts/check-event-access-ui.mjs) · [npm run check:invite](../../../scripts/check-invite.mjs) |
| RF-R4-09.CA-04 | PASS | Validado | [npm run check:event-access](../../../scripts/check-event-access.mjs) · [npm run check:event-access:ui](../../../scripts/check-event-access-ui.mjs) · [npm run check:invite](../../../scripts/check-invite.mjs) |
| RF-R4-09.CA-05 | PASS | Validado | [npm run check:event-access](../../../scripts/check-event-access.mjs) · [npm run check:event-access:ui](../../../scripts/check-event-access-ui.mjs) · [npm run check:invite](../../../scripts/check-invite.mjs) |

## Escenarios D/P/H

| Caso | Resultado local | Pruebas |
| --- | --- | --- |
| D01 | PASS | npm run check:search · npm run check:search:ui |
| D02 | PASS | npm run check:search |
| D03 | PASS | npm run check:search · npm run check:search:ui |
| D04 | PASS | npm run check:search · npm run check:filters:ui |
| D05 | PASS | npm run check:search:ui · npm run check:filters:ui |
| D06 | PASS | npm run check:r4:boundaries · npm run check:search |
| D07 | PASS | npm run check:search · npm run check:filters:ui |
| D08 | PASS | npm run check:r4:boundaries · npm run check:filters:ui |
| D09 | PASS | npm run check:search |
| D10 | PASS | npm run check:search · npm run check:search:ui · npm run check:discovery:ui |
| D11 | PASS | npm run check:search:ui · npm run check:filters:ui |
| D12 | PASS | npm run check:filters:ui · npm run check:search:ui |
| P01 | PASS | npm run check:interests · npm run check:interests:ui |
| P02 | PASS | npm run check:interests · npm run check:interests:ui |
| P03 | PASS | npm run check:interests |
| P04 | PASS | npm run check:interests:ui |
| P05 | PASS | npm run check:suggestions |
| P06 | PASS | npm run check:suggestions · npm run check:suggestions:ui |
| P07 | PASS | npm run check:suggestions · npm run check:hidden-access |
| H01 | PASS | npm run check:event-links |
| H02 | PASS | npm run check:hidden-access · npm run check:invite |
| H03 | PASS | npm run check:invite · npm run check:hidden-access |
| H04 | PASS | npm run check:invite |
| H05 | PASS | npm run check:invite |
| H06 | PASS | npm run check:event-links |
| H07 | PASS | npm run check:event-links · npm run check:invite |
| H08 | PASS | npm run check:invite · npm run check:event-access |
| H09 | PASS | npm run check:invite |
| H10 | PASS | npm run check:invite |
| H11 | PASS | npm run check:hidden-access · npm run check:event-links |
| H12 | PASS | npm run check:hidden-access · npm run check:invite · npm run check:event-access |
| H13 | PASS | npm run check:invite · npm run check:hidden-access |
| H14 | PASS | npm run check:event-access |
| H15 | PASS | npm run check:event-access · npm run check:event-links |
| H16 | PASS | npm run check:event-access · npm run check:rejoin |
| H17 | PASS | npm run check:event-access |
| H18 | PASS | npm run check:event-access |
| H19 | PASS | npm run check:hidden-access |
| H20 | PASS | npm run check:event-access · npm run check:hidden-access |
| H21 | PASS | npm run check:invite:ui |
| H22 | PASS | npm run check:interests:ui · npm run check:suggestions:ui · npm run check:r4:ui |
| H23 | PASS | npm run check:event-links · npm run check:hidden-access |
| H24 | PASS | npm run check:event-links · npm run check:event-actions |
| H25 | PASS | npm run check:hidden-access · npm run check:event-links |
| H26 | PASS | npm run check:hidden-access · npm run check:invite |
| H27 | PASS | npm run check:event-links · npm run check:event-links:ui |
| H28 | PASS | npm run check:hidden-access · npm run check:invite |

Cada directorio indicado en [traceability.json](traceability.json) contiene los resultados/afirmaciones de su suite, y [commands.json](commands.json) conserva comandos, duración, salida e intentos. El PASS combinado no acredita la capa remota.
