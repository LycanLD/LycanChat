import { AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/hooks/use-language";

interface StaticChatNoticeProps {
  isConnected: boolean;
}

export function StaticChatNotice({ isConnected }: StaticChatNoticeProps) {
  const { t } = useLanguage();

  if (isConnected) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <Wifi className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700 dark:text-green-300">
          {t.connectedToServer}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
      <WifiOff className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        <div className="space-y-1">
          <div className="font-medium">
            {t.staticModeTitle}
          </div>
          <div className="text-sm">
            {t.staticModeDescription}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}