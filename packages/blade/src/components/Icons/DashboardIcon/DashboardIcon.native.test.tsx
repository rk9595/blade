import DashboardIcon from './';
import renderWithTheme from '~utils/testing/renderWithTheme.native';

describe('<DashboardIcon />', () => {
  it('should render DashboardIcon', () => {
    const renderTree = renderWithTheme(
      <DashboardIcon color="feedback.icon.neutral.lowContrast" size="large" />,
    ).toJSON();
    expect(renderTree).toMatchSnapshot();
  });
});
