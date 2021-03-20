import React, { useState } from 'react';
import { css } from 'emotion';
import pick from 'lodash/pick';
import omit from 'lodash/omit';
import { GrafanaTheme } from '@grafana/data';
import { Button, stylesFactory, useStyles } from '@grafana/ui';
import { PanelModel } from 'app/features/dashboard/state';
import { AddLibraryPanelModal } from '../AddLibraryPanelModal/AddLibraryPanelModal';
import { LibraryPanelsView } from '../LibraryPanelsView/LibraryPanelsView';
import { PanelOptionsChangedEvent, PanelQueriesChangedEvent } from 'app/types/events';
import { LibraryPanelDTO } from '../../types';
import { toPanelModelLibraryPanel } from '../../utils';
import { useDispatch } from 'react-redux';
import { changePanelPlugin } from 'app/features/dashboard/state/actions';
import { getDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';

interface Props {
  panel: PanelModel;
  searchQuery: string;
}

export const PanelLibraryOptionsGroup: React.FC<Props> = ({ panel, searchQuery }) => {
  const styles = useStyles(getStyles);
  const [showingAddPanelModal, setShowingAddPanelModal] = useState(false);
  const dashboard = getDashboardSrv().getCurrent();
  const dispatch = useDispatch();

  const useLibraryPanel = (panelInfo: LibraryPanelDTO) => {
    const panelTypeChanged = panel.type !== panelInfo.model.type;

    if (panelTypeChanged) {
      dispatch(changePanelPlugin(panel, panelInfo.model.type));
    }

    setTimeout(() => {
      panel.restoreModel({
        ...omit(panelInfo.model, 'type'),
        ...pick(panel, 'gridPos', 'id'),
        libraryPanel: toPanelModelLibraryPanel(panelInfo),
      });

      panel.hasChanged = false;
      panel.refresh();
      panel.events.publish(new PanelQueriesChangedEvent());
      panel.events.publish(new PanelOptionsChangedEvent());
    }, 500);
  };

  const onAddToPanelLibrary = () => {
    setShowingAddPanelModal(true);
  };

  return (
    <div className={styles.box}>
      {!panel.libraryPanel && (
        <div className={styles.addButtonWrapper}>
          <Button icon="plus" onClick={onAddToPanelLibrary} variant="secondary" fullWidth>
            Add current panel to library
          </Button>
        </div>
      )}

      <LibraryPanelsView
        formatDate={(dateString: string) => dashboard.formatDate(dateString, 'L')}
        currentPanelId={panel.libraryPanel?.uid}
        searchString={searchQuery}
        showSecondaryActions
      >
        {(panel) => (
          <Button variant="secondary" onClick={() => useLibraryPanel(panel)}>
            Use instead of current panel
          </Button>
        )}
      </LibraryPanelsView>

      {showingAddPanelModal && (
        <AddLibraryPanelModal
          panel={panel}
          onDismiss={() => setShowingAddPanelModal(false)}
          initialFolderId={dashboard.meta.folderId}
          isOpen={showingAddPanelModal}
        />
      )}
    </div>
  );
};

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    box: css``,
    addButtonWrapper: css`
      padding-bottom: ${theme.spacing.md};
      text-align: center;
    `,
    panelLibraryTitle: css`
      display: flex;
      gap: 10px;
    `,
  };
});
