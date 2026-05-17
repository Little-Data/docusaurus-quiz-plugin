import OriginalMDXComponents from '@theme-init/MDXComponents';
import Workpaper from '@theme/Workpaper';
import Workitem from '@theme/Workitem';
import Wenben from '@theme/Wenben';
import Xuanxiang from '@theme/Xuanxiang';
import Jiexi from '@theme/Jiexi';
import Ansinput from '@theme/Ansinput';
import Workpapersettings from '@theme/Workpapersettings';

const MergedComponents = {
  ...OriginalMDXComponents,
  Workpaper,
  Workitem,
  Wenben,
  Xuanxiang,
  Jiexi,
  Ansinput,
  Workpapersettings,
};

export default MergedComponents;