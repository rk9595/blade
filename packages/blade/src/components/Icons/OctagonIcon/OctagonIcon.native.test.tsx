import OctagonIcon from './';
import renderWithTheme from '~utils/testing/renderWithTheme.native';

describe('<OctagonIcon />', () => {
  it('should render OctagonIcon', () => {
    const renderTree = renderWithTheme(
      <OctagonIcon color="feedback.icon.neutral.lowContrast" size="large" />,
    ).toJSON();
    expect(renderTree).toMatchSnapshot();
  });
});
